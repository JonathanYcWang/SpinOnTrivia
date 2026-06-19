"use client";

import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tabs } from "@/components/ui/Tabs";
import {
  type FieldError,
  validateGameData,
} from "@/features/config/configValidation";
import type {
  PowerUpType,
  RewardCoinValue,
  RewardType,
} from "@/features/config/configTypes";
import {
  withAddedReward,
  withQuestionEdit,
  withRewardEdits,
  withDeletedReward,
  editableGameDataFromConfig,
  type EditableGameData,
} from "@/features/config/editableGameData";
import { createId } from "@/lib/ids";
import { BoardTab } from "./board/BoardTab";
import { GameProvider, useGame } from "./GameProvider";
import { useGameplayLeaveGuard } from "./gameplayLeaveGuard";
import { RulesTab } from "./rules/RulesTab";
import { ShopTab } from "./shop/ShopTab";
import { WheelTab } from "./wheel/WheelTab";

type InitialGameDataResult =
  | { valid: true; data: EditableGameData }
  | { valid: false; fieldErrors: FieldError[] };

async function saveGameData(data: EditableGameData) {
  const response = await fetch("/api/game-data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const result = (await response.json()) as
    | { status: "ok"; data: EditableGameData }
    | { status: "invalid"; fieldErrors: FieldError[] }
    | { status: "error"; message: string };
  if (!response.ok || result.status !== "ok") {
    const message =
      result.status === "invalid"
        ? result.fieldErrors[0]?.message ?? "Saved data is invalid."
        : result.status === "error"
          ? result.message
          : "Unable to save game data.";
    throw new Error(
      message,
    );
  }
  return result.data;
}

export function GamePageClient({
  initialEditMode,
  initialGameDataResult,
}: {
  initialEditMode: boolean;
  initialGameDataResult: InitialGameDataResult;
}) {
  const [gameData, setGameData] = useState<EditableGameData | null>(
    initialGameDataResult.valid ? initialGameDataResult.data : null,
  );
  const [saveError, setSaveError] = useState("");

  const config = useMemo(() => {
    if (!gameData) return null;
    const validation = validateGameData(gameData);
    return validation.valid ? validation.config : null;
  }, [gameData]);

  const saveNextGameData = useCallback(async (nextGameData: EditableGameData) => {
    const savedData = await saveGameData(nextGameData);
    const validation = validateGameData(savedData);
    if (!validation.valid) throw new Error("Saved game data is invalid.");
    setGameData(savedData);
    setSaveError("");
  }, []);

  const saveQuestionEdit = useCallback(
    async (
      questionId: string,
      question: string,
      answer: string,
      powerUpType: PowerUpType | null,
    ) => {
      if (!gameData) return;
      try {
        await saveNextGameData(
          withQuestionEdit(gameData, questionId, question, answer, powerUpType),
        );
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Unable to save game data.",
        );
      }
    },
    [gameData, saveNextGameData],
  );

  const saveRewardEdit = useCallback(
    async (
      rewardId: string,
      name: string,
      value: RewardCoinValue,
      type: RewardType,
    ) => {
      if (!gameData) return;
      try {
        await saveNextGameData(
          withRewardEdits(gameData, [{ rewardId, name, value, type }]),
        );
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Unable to save game data.",
        );
      }
    },
    [gameData, saveNextGameData],
  );

  const saveRewardEdits = useCallback(
    async (
      rewards: Array<{
        rewardId: string;
        name: string;
        value: RewardCoinValue;
        type: RewardType;
      }>,
    ) => {
      if (!gameData) return;
      try {
        await saveNextGameData(withRewardEdits(gameData, rewards));
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Unable to save game data.",
        );
      }
    },
    [gameData, saveNextGameData],
  );

  const deleteReward = useCallback(
    async (rewardId: string) => {
      if (!gameData) return;
      try {
        await saveNextGameData(withDeletedReward(gameData, rewardId));
      } catch (error) {
        setSaveError(
          error instanceof Error ? error.message : "Unable to save game data.",
        );
      }
    },
    [gameData, saveNextGameData],
  );

  const addReward = useCallback(() => {
    if (!gameData || !config) return null;
    const reward = {
      id: createId("reward"),
      name: "A Placeholder",
      description: "",
      coinValue: 30 as RewardCoinValue,
      type: "SELLABLE" as RewardType,
    };
    const nextGameData = withAddedReward(gameData, reward);
    setGameData(nextGameData);
    saveNextGameData(nextGameData).catch((error) => {
      setGameData(editableGameDataFromConfig(config));
      setSaveError(
        error instanceof Error ? error.message : "Unable to save game data.",
      );
    });
    return reward;
  }, [config, gameData, saveNextGameData]);

  if (!config) {
    const errors = initialGameDataResult.valid
      ? [{ field: "game-data", message: "Game data is invalid." }]
      : initialGameDataResult.fieldErrors;
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-8">
        <h1 className="text-2xl font-bold">Game cannot start</h1>
        <Card className="border-[var(--danger)]/40 bg-[var(--danger)]/10">
          <ul className="space-y-1 text-sm text-[var(--danger)]">
            {errors.map((error, index) => (
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
      deleteReward={deleteReward}
      addReward={addReward}
    >
      {saveError ? (
        <Card className="mx-auto mt-4 w-full max-w-6xl border-[var(--danger)]/40 bg-[var(--danger)]/10 text-[var(--danger)]">
          {saveError}
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
      {state.activeTab === "RULES" ? <RulesTab /> : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--background)]/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl justify-center">
          <Tabs
            ariaLabel="Gameplay tabs"
            disabled={state.isWheelSpinning}
            tabs={[
              { value: "BOARD", label: "Board" },
              { value: "WHEEL", label: "Wheel" },
              { value: "SHOP", label: "Shop" },
              { value: "RULES", label: "Rules" },
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
