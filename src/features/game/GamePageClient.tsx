"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tabs } from "@/components/ui/Tabs";
import {
  getBaseGameConfig,
  type FieldError,
} from "@/features/config/configValidation";
import type { RewardCoinValue } from "@/features/config/configTypes";
import {
  applyEditOverrides,
  loadEditOverrides,
  saveEditOverrides,
  withAddedReward,
  withQuestionOverride,
  withRewardOverride,
  withRewardOverrides,
  type EditOverrides,
} from "@/features/config/editOverrides";
import { createId } from "@/lib/ids";
import { BoardTab } from "./board/BoardTab";
import { GameProvider, useGame } from "./GameProvider";
import { useGameplayLeaveGuard } from "./gameplayLeaveGuard";
import { ShopTab } from "./shop/ShopTab";
import { WheelTab } from "./wheel/WheelTab";

function loadConfigForGame() {
  const validation = getBaseGameConfig();
  if (!validation.valid) {
    return {
      baseConfig: null,
      overrides: null,
      warning: "",
      errors: validation.fieldErrors,
    };
  }
  const overrideResult = loadEditOverrides();
  return {
    baseConfig: validation.config,
    overrides: overrideResult.overrides,
    warning: overrideResult.warning,
    errors: [] as FieldError[],
  };
}

export function GamePageClient({
  initialEditMode,
}: {
  initialEditMode: boolean;
}) {
  const [loaded] = useState(loadConfigForGame);
  const [overrides, setOverrides] = useState<EditOverrides | null>(
    loaded.overrides,
  );

  const config = useMemo(() => {
    if (!loaded.baseConfig || !overrides) return null;
    return applyEditOverrides(loaded.baseConfig, overrides);
  }, [loaded.baseConfig, overrides]);

  const saveQuestionEdit = useCallback(
    (questionId: string, question: string, answer: string) => {
      if (!overrides) return;
      const nextOverrides = withQuestionOverride(
        overrides,
        questionId,
        question,
        answer,
      );
      saveEditOverrides(nextOverrides);
      setOverrides(nextOverrides);
    },
    [overrides],
  );

  const saveRewardEdit = useCallback(
    (rewardId: string, name: string, value: RewardCoinValue) => {
      if (!overrides) return;
      const nextOverrides = withRewardOverride(overrides, rewardId, name, value);
      saveEditOverrides(nextOverrides);
      setOverrides(nextOverrides);
    },
    [overrides],
  );

  const saveRewardEdits = useCallback(
    (
      rewards: Array<{
        rewardId: string;
        name: string;
        value: RewardCoinValue;
      }>,
    ) => {
      if (!overrides) return;
      const nextOverrides = withRewardOverrides(overrides, rewards);
      saveEditOverrides(nextOverrides);
      setOverrides(nextOverrides);
    },
    [overrides],
  );

  const addReward = useCallback(() => {
    if (!overrides || !config) return null;
    const reward = {
      id: createId("reward"),
      name: "Blind Box",
      description: "",
      coinValue: 60 as RewardCoinValue,
    };
    const nextOverrides = withAddedReward(overrides, reward);
    saveEditOverrides(nextOverrides);
    setOverrides(nextOverrides);
    return reward;
  }, [config, overrides]);

  if (!config) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-bold">Game cannot start</h1>
        <Card className="border-[var(--danger)]/40 bg-[var(--danger)]/10">
          <ul className="space-y-1 text-sm text-[var(--danger)]">
            {loaded.errors.map((error, index) => (
              <li key={`${error.field}-${index}`}>{error.message}</li>
            ))}
          </ul>
        </Card>
      </main>
    );
  }
  return (
    <GameProvider
      config={config}
      isEditMode={initialEditMode}
      saveQuestionEdit={saveQuestionEdit}
      saveRewardEdit={saveRewardEdit}
      saveRewardEdits={saveRewardEdits}
      addReward={addReward}
    >
      {loaded.warning ? (
        <Card className="mx-auto mt-4 w-full max-w-6xl border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]">
          {loaded.warning}
        </Card>
      ) : null}
      <GameShell />
    </GameProvider>
  );
}

function GameShell() {
  const { config, state, dispatch } = useGame();
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  useGameplayLeaveGuard(state);

  function startNewGame() {
    if (state.gameStatus === "ACTIVE") {
      setConfirmNewGame(true);
      return;
    }
    dispatch({ type: "START_NEW_GAME", config });
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 pb-24">
      {state.gameStatus === "GAME_OVER" ? (
        <Card className="mb-4 border-[var(--primary)]/40 bg-[var(--primary)]/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold">Game Over</h1>
              <p className="text-sm text-[var(--text-muted)]">
                No more actions are available.
              </p>
            </div>
            <Button onClick={startNewGame} variant="primary">
              New Game
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
          <Button onClick={startNewGame}>New Game</Button>
        </div>
      )}

      {state.activeTab === "BOARD" ? <BoardTab /> : null}
      {state.activeTab === "WHEEL" ? <WheelTab /> : null}
      {state.activeTab === "SHOP" ? <ShopTab /> : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl justify-center">
          <Tabs
            ariaLabel="Gameplay tabs"
            tabs={[
              { value: "BOARD", label: "Board" },
              { value: "WHEEL", label: "Wheel" },
              { value: "SHOP", label: "Shop" },
            ]}
            value={state.activeTab}
            onChange={(tab) => dispatch({ type: "SET_ACTIVE_TAB", tab })}
          />
        </div>
      </nav>

      {confirmNewGame ? (
        <ConfirmDialog
          title="Start a new game?"
          body="Your current progress will be lost."
          cancelLabel="Cancel"
          confirmLabel="Start New Game"
          onCancel={() => setConfirmNewGame(false)}
          onConfirm={() => {
            setConfirmNewGame(false);
            dispatch({ type: "START_NEW_GAME", config });
          }}
        />
      ) : null}
    </main>
  );
}
