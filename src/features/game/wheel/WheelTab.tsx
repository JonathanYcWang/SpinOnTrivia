"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { CoinDisplay } from "@/components/ui/CoinDisplay";
import type { RewardConfig } from "@/features/config/configTypes";
import { WHEEL_SPIN_FALLBACK_MS } from "@/lib/timers";
import { useGame } from "../GameProvider";
import { canSpin, getRewardById } from "../gameSelectors";
import { getRandomIndex, getTargetRotationDeg } from "./wheelMath";
import { RewardWheel } from "./RewardWheel";
import { getWheelSegments, getWheelSegmentsByIds } from "./wheelSegments";

export function WheelTab() {
  const { config, state, isEditMode, dispatch } = useGame();
  const [winningReward, setWinningReward] = useState<RewardConfig | null>(null);
  const [emptyResult, setEmptyResult] = useState(false);
  const finishedRef = useRef(false);
  const segments = state.spinSnapshotSegmentIds
    ? getWheelSegmentsByIds(config, state.spinSnapshotSegmentIds)
    : getWheelSegments(config, state);

  function finishSpin() {
    if (!state.isWheelSpinning || finishedRef.current) return;
    finishedRef.current = true;
    if (
      !state.selectedSpinRewardId ||
      state.spentWheelRewardIds.includes(state.selectedSpinRewardId)
    ) {
      setEmptyResult(true);
      return;
    }
    const reward = state.selectedSpinRewardId
      ? getRewardById(config, state.selectedSpinRewardId)
      : null;
    if (reward) setWinningReward(reward);
  }

  useEffect(() => {
    if (!state.isWheelSpinning) {
      finishedRef.current = false;
      return;
    }
    const timeout = window.setTimeout(finishSpin, WHEEL_SPIN_FALLBACK_MS);
    return () => window.clearTimeout(timeout);
  });

  function startSpin() {
    const selectedIndex = getRandomIndex(segments.length);
    const selectedSegment = segments[selectedIndex];
    dispatch({
      type: "START_SPIN",
      segmentId: selectedSegment.id,
      rewardId:
        selectedSegment.type === "REWARD" ? selectedSegment.reward.id : null,
      spinSnapshotSegmentIds: segments.map((segment) => segment.id),
      targetRotationDeg: getTargetRotationDeg(
        state.wheelRotationDeg,
        selectedIndex,
        segments.length,
      ),
      config,
    });
  }

  function closeWinningDialog() {
    setWinningReward(null);
    dispatch({ type: "FINISH_SPIN", config });
  }

  function closeEmptyDialog() {
    setEmptyResult(false);
    dispatch({ type: "FINISH_SPIN", config });
  }

  return (
    <section className="space-y-5">
      <div className="text-2xl font-bold">
        <CoinDisplay value={state.playerCoins} />
      </div>
      <p className="text-sm font-semibold text-[var(--text-muted)]">
        Next spin: <CoinDisplay value={state.nextSpinCost} />
      </p>
      {segments.length === 0 ? (
        <p className="text-[var(--text-muted)]">
          No rewards remain on the wheel.
        </p>
      ) : (
        <div className="relative">
          <RewardWheel
            segments={segments}
            spentRewardIds={state.spentWheelRewardIds}
            rotationDeg={state.wheelRotationDeg}
            onTransitionEnd={finishSpin}
            onSpin={startSpin}
            canSpin={!isEditMode && canSpin(config, state)}
          />
          {winningReward ? (
            <div className="absolute inset-0 z-20 grid place-items-center rounded-full bg-[var(--background)]/70 px-8">
              <div
                aria-modal="true"
                className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center shadow-2xl"
                role="dialog"
              >
                <p className="text-sm font-semibold uppercase text-[var(--primary)]">
                  You won
                </p>
                <h2 className="mt-2 text-2xl font-bold">
                  {winningReward.name}
                </h2>
                {winningReward.description ? (
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {winningReward.description}
                  </p>
                ) : null}
                <div className="mt-5 flex justify-end">
                  <Button onClick={closeWinningDialog} variant="primary">
                    OK
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
          {emptyResult ? (
            <div className="absolute inset-0 z-20 grid place-items-center rounded-full bg-[var(--background)]/70 px-8">
              <div
                aria-modal="true"
                className="w-full max-w-xs rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-center shadow-2xl"
                role="dialog"
              >
                <p className="text-sm font-semibold uppercase text-[var(--primary)]">
                  Better luck next time
                </p>
                <h2 className="mt-2 text-2xl font-bold">No reward</h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Nothing is won on this segment. Spin again for another chance.
                </p>
                <div className="mt-5 flex justify-end">
                  <Button onClick={closeEmptyDialog} variant="primary">
                    OK
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
