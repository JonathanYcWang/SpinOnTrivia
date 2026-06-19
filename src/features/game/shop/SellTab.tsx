"use client";

import { useState } from "react";
import type { RewardConfig } from "@/features/config/configTypes";
import { canSellReward, getOwnedRewards, getSellValue } from "../gameSelectors";
import { useGame } from "../GameProvider";
import { RewardCard } from "./RewardCard";
import { SellRewardDialog } from "./SellRewardDialog";

export function SellTab() {
  const { config, state, isEditMode, dispatch } = useGame();
  const [selectedReward, setSelectedReward] = useState<RewardConfig | null>(
    null,
  );
  const rewards = getOwnedRewards(config, state);
  if (rewards.length === 0)
    return (
      <p className="text-[var(--text-muted)]">
        You don&apos;t own any rewards yet.
      </p>
    );

  return (
    <>
      {state.isSellingLocked ? (
        <p className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-muted)]">
          Selling is locked until the next correct answer.
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rewards.map((reward) => (
          <RewardCard
            disabled={isEditMode || !canSellReward(state, reward)}
            key={reward.id}
            mode="sell"
            reward={reward}
            value={getSellValue(reward)}
            onAction={() => setSelectedReward(reward)}
          />
        ))}
      </div>
      {selectedReward ? (
        <SellRewardDialog
          reward={selectedReward}
          onCancel={() => setSelectedReward(null)}
          onConfirm={() => {
            dispatch({
              type: "SELL_REWARD",
              rewardId: selectedReward.id,
              config,
            });
            setSelectedReward(null);
          }}
        />
      ) : null}
    </>
  );
}
