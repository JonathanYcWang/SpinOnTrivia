"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from "react";
import type { GameConfig } from "@/features/config/configTypes";
import type {
  PowerUpType,
  RewardCoinValue,
  RewardConfig,
  RewardType,
} from "@/features/config/configTypes";
import { gameReducer, type GameAction } from "./gameReducer";
import { initializeGameState } from "./gameInitialization";
import type { GameState } from "./gameTypes";

type GameContextValue = {
  config: GameConfig;
  state: GameState;
  isEditMode: boolean;
  dispatch(action: GameAction): void;
  saveQuestionEdit(
    questionId: string,
    question: string,
    answer: string,
    powerUpType: PowerUpType | null,
  ): void | Promise<void>;
  saveRewardEdit(
    rewardId: string,
    name: string,
    value: RewardCoinValue,
    type: RewardType,
  ): void | Promise<void>;
  saveRewardEdits(
    rewards: Array<{
      rewardId: string;
      name: string;
      value: RewardCoinValue;
      type: RewardType;
    }>,
  ): void | Promise<void>;
  deleteReward(rewardId: string): void | Promise<void>;
  addReward(): RewardConfig | null;
};

const noop = () => undefined;
const noopAddReward = () => null;

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  config,
  children,
  isEditMode = false,
  saveQuestionEdit = noop,
  saveRewardEdit = noop,
  saveRewardEdits = noop,
  deleteReward = noop,
  addReward = noopAddReward,
}: {
  config: GameConfig;
  children: ReactNode;
  isEditMode?: boolean;
  saveQuestionEdit?(
    questionId: string,
    question: string,
    answer: string,
    powerUpType: PowerUpType | null,
  ): void | Promise<void>;
  saveRewardEdit?(
    rewardId: string,
    name: string,
    value: RewardCoinValue,
    type: RewardType,
  ): void | Promise<void>;
  saveRewardEdits?(
    rewards: Array<{
      rewardId: string;
      name: string;
      value: RewardCoinValue;
      type: RewardType;
    }>,
  ): void | Promise<void>;
  deleteReward?(rewardId: string): void | Promise<void>;
  addReward?(): RewardConfig | null;
}) {
  const [state, dispatch] = useReducer(gameReducer, config, initializeGameState);
  const addRewardAndSyncState = useCallback(() => {
    const reward = addReward();
    if (!reward) return null;
    dispatch({ type: "ADD_REWARD", rewardId: reward.id, config });
    return reward;
  }, [addReward, config]);
  const value = useMemo(
    () => ({
      config,
      state,
      isEditMode,
      dispatch,
      saveQuestionEdit,
      saveRewardEdit,
      saveRewardEdits,
      deleteReward,
      addReward: addRewardAndSyncState,
    }),
    [
      config,
      state,
      isEditMode,
      saveQuestionEdit,
      saveRewardEdit,
      saveRewardEdits,
      deleteReward,
      addRewardAndSyncState,
    ],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}
