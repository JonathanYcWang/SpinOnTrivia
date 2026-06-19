import type { GameConfig } from "@/features/config/configTypes";
import { initializeGameState } from "./gameInitialization";
import {
  getQuestionById,
  getRewardById,
  getSellValue,
  isGameOver,
} from "./gameSelectors";
import {
  BASE_SPIN_COST,
  type GameplayTab,
  type GameState,
  type ShopTab,
} from "./gameTypes";
import { getCorrectStreakBonus } from "./gameRules";

export type GameAction =
  | { type: "START_NEW_GAME"; config: GameConfig }
  | { type: "SET_ACTIVE_TAB"; tab: GameplayTab }
  | { type: "SET_ACTIVE_SHOP_TAB"; tab: ShopTab }
  | { type: "OPEN_QUESTION"; questionId: string; mode?: "PLAY" | "EDIT" }
  | { type: "CLOSE_QUESTION" }
  | {
      type: "MARK_QUESTION";
      questionId: string;
      result: "CORRECT" | "INCORRECT";
      config: GameConfig;
    }
  | {
      type: "START_SPIN";
      segmentId: string;
      rewardId: string | null;
      spinSnapshotSegmentIds: string[];
      targetRotationDeg: number;
      config: GameConfig;
    }
  | { type: "FINISH_SPIN"; config: GameConfig }
  | { type: "ADD_REWARD"; rewardId: string; config: GameConfig }
  | { type: "DELETE_REWARD"; rewardId: string; config: GameConfig }
  | { type: "BUY_REWARD"; rewardId: string; config: GameConfig }
  | { type: "SELL_REWARD"; rewardId: string; config: GameConfig };

function withRecomputedGameStatus(
  config: GameConfig,
  state: GameState,
): GameState {
  return isGameOver(config, state)
    ? { ...state, gameStatus: "GAME_OVER" }
    : state;
}

function removeId(ids: string[], id: string) {
  return ids.filter((currentId) => currentId !== id);
}

function applyCorrectAnswerCoins(state: GameState, questionCoinValue: number) {
  const correctStreakCount = state.correctStreakCount + 1;
  const isStreakBonusActive =
    state.isStreakBonusActive || correctStreakCount >= 3;
  const questionCoins =
    questionCoinValue +
    (isStreakBonusActive ? getCorrectStreakBonus(correctStreakCount) : 0);
  return {
    playerCoins: state.playerCoins + questionCoins,
    correctStreakCount,
    isStreakBonusActive,
  };
}

function applySpinCostPowerUp(
  currentCost: number,
  powerUpType: string | undefined,
  result: "CORRECT" | "INCORRECT",
) {
  if (
    result === "INCORRECT" &&
    powerUpType === "DOUBLE_SPIN_COST_ON_INCORRECT"
  ) {
    return BASE_SPIN_COST * 2;
  }
  if (result === "CORRECT" && powerUpType === "HALVE_SPIN_COST_ON_CORRECT") {
    return BASE_SPIN_COST / 2;
  }
  return currentCost;
}

function applyPowerUpCoins({
  playerCoins,
  powerUpType,
  result,
}: {
  playerCoins: number;
  powerUpType: string | undefined;
  result: "CORRECT" | "INCORRECT";
}) {
  if (result === "CORRECT") {
    if (powerUpType === "DOUBLE_BALANCE_ON_CORRECT") return playerCoins * 2;
    if (powerUpType === "BONUS_ON_CORRECT") return playerCoins + 20;
  }
  if (result === "INCORRECT" && powerUpType === "HALVE_BALANCE_ON_INCORRECT") {
    return Math.ceil(playerCoins / 2);
  }
  return playerCoins;
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_NEW_GAME":
      return withRecomputedGameStatus(
        action.config,
        initializeGameState(action.config),
      );
    case "SET_ACTIVE_TAB":
      return state.isWheelSpinning
        ? state
        : { ...state, activeTab: action.tab };
    case "SET_ACTIVE_SHOP_TAB":
      return { ...state, activeShopTab: action.tab };
    case "OPEN_QUESTION": {
      if (action.mode === "EDIT") {
        if (state.activeQuestionId || state.isWheelSpinning) return state;
        return { ...state, activeQuestionId: action.questionId };
      }
      if (
        state.gameStatus !== "ACTIVE" ||
        state.activeQuestionId ||
        state.questionStates[action.questionId] !== "AVAILABLE" ||
        state.isWheelSpinning
      ) {
        return state;
      }
      return { ...state, activeQuestionId: action.questionId };
    }
    case "CLOSE_QUESTION":
      return { ...state, activeQuestionId: null };
    case "MARK_QUESTION": {
      const question = getQuestionById(action.config, action.questionId);
      if (
        !question ||
        state.activeQuestionId !== action.questionId ||
        state.questionStates[action.questionId] !== "AVAILABLE"
      ) {
        return state;
      }
      const powerUpType = question.powerUp?.type;
      const answerState =
        action.result === "CORRECT"
          ? applyCorrectAnswerCoins(state, question.coinValue)
          : {
              playerCoins: state.playerCoins,
              correctStreakCount: 0,
              isStreakBonusActive: false,
            };
      const nextState = {
        ...state,
        playerCoins: applyPowerUpCoins({
          playerCoins: answerState.playerCoins,
          powerUpType,
          result: action.result,
        }),
        correctStreakCount: answerState.correctStreakCount,
        isStreakBonusActive: answerState.isStreakBonusActive,
        nextSpinCost: applySpinCostPowerUp(
          state.nextSpinCost,
          powerUpType,
          action.result,
        ),
        activeQuestionId: null,
        questionStates: {
          ...state.questionStates,
          [action.questionId]: action.result,
        },
      };
      return withRecomputedGameStatus(action.config, nextState);
    }
    case "START_SPIN": {
      if (
        state.playerCoins < state.nextSpinCost ||
        state.wheelRewardIds.length < 1 ||
        state.isWheelSpinning ||
        (action.rewardId !== null &&
          !state.wheelRewardIds.includes(action.rewardId))
      ) {
        return state;
      }
      return {
        ...state,
        playerCoins: state.playerCoins - state.nextSpinCost,
        nextSpinCost: BASE_SPIN_COST,
        isWheelSpinning: true,
        spinSnapshotSegmentIds: action.spinSnapshotSegmentIds,
        selectedSpinSegmentId: action.segmentId,
        selectedSpinRewardId: action.rewardId,
        spinOutcome: null,
        wheelRotationDeg: action.targetRotationDeg,
      };
    }
    case "FINISH_SPIN": {
      if (!state.isWheelSpinning || !state.selectedSpinSegmentId) return state;
      if (!state.selectedSpinRewardId) {
        const nextState = {
          ...state,
          isWheelSpinning: false,
          spinSnapshotSegmentIds: null,
          selectedSpinSegmentId: null,
          selectedSpinRewardId: null,
          spinOutcome: "EMPTY" as const,
        };
        return withRecomputedGameStatus(action.config, nextState);
      }
      const rewardId = state.selectedSpinRewardId;
      const alreadySpent = state.spentWheelRewardIds.includes(rewardId);
      const nextState = {
        ...state,
        ownedRewardIds:
          alreadySpent || state.ownedRewardIds.includes(rewardId)
            ? state.ownedRewardIds
            : [...state.ownedRewardIds, rewardId],
        shopRewardIds: removeId(state.shopRewardIds, rewardId),
        spentWheelRewardIds: alreadySpent
          ? state.spentWheelRewardIds
          : [...state.spentWheelRewardIds, rewardId],
        isWheelSpinning: false,
        spinSnapshotSegmentIds: null,
        selectedSpinSegmentId: null,
        selectedSpinRewardId: null,
        spinOutcome: alreadySpent ? ("EMPTY" as const) : ("REWARD" as const),
      };
      return withRecomputedGameStatus(action.config, nextState);
    }
    case "ADD_REWARD": {
      if (
        state.wheelRewardIds.includes(action.rewardId) ||
        state.shopRewardIds.includes(action.rewardId)
      ) {
        return state;
      }
      return {
        ...state,
        gameStatus:
          state.gameStatus === "GAME_OVER" ? "ACTIVE" : state.gameStatus,
        wheelRewardIds: [...state.wheelRewardIds, action.rewardId],
        shopRewardIds: [...state.shopRewardIds, action.rewardId],
      };
    }
    case "DELETE_REWARD": {
      const nextState = {
        ...state,
        ownedRewardIds: removeId(state.ownedRewardIds, action.rewardId),
        soldRewardIds: removeId(state.soldRewardIds, action.rewardId),
        wheelRewardIds: removeId(state.wheelRewardIds, action.rewardId),
        shopRewardIds: removeId(state.shopRewardIds, action.rewardId),
        spentWheelRewardIds: removeId(state.spentWheelRewardIds, action.rewardId),
        selectedSpinRewardId:
          state.selectedSpinRewardId === action.rewardId
            ? null
            : state.selectedSpinRewardId,
      };
      return withRecomputedGameStatus(action.config, nextState);
    }
    case "BUY_REWARD": {
      const reward = getRewardById(action.config, action.rewardId);
      if (
        !reward ||
        state.gameStatus !== "ACTIVE" ||
        !state.wheelRewardIds.includes(action.rewardId) ||
        !state.shopRewardIds.includes(action.rewardId) ||
        state.playerCoins < reward.coinValue ||
        state.ownedRewardIds.includes(action.rewardId) ||
        state.soldRewardIds.includes(action.rewardId) ||
        state.isWheelSpinning
      ) {
        return state;
      }
      const nextState = {
        ...state,
        playerCoins: state.playerCoins - reward.coinValue,
        ownedRewardIds: [...state.ownedRewardIds, action.rewardId],
        wheelRewardIds: removeId(state.wheelRewardIds, action.rewardId),
        shopRewardIds: removeId(state.shopRewardIds, action.rewardId),
      };
      return withRecomputedGameStatus(action.config, nextState);
    }
    case "SELL_REWARD": {
      const reward = getRewardById(action.config, action.rewardId);
      if (
        !reward ||
        reward.type === "UNSELLABLE" ||
        !state.ownedRewardIds.includes(action.rewardId) ||
        state.soldRewardIds.includes(action.rewardId) ||
        state.isWheelSpinning
      ) {
        return state;
      }
      const nextState = {
        ...state,
        playerCoins: state.playerCoins + getSellValue(reward),
        ownedRewardIds: removeId(state.ownedRewardIds, action.rewardId),
        soldRewardIds: [...state.soldRewardIds, action.rewardId],
      };
      return withRecomputedGameStatus(action.config, nextState);
    }
    default:
      return state;
  }
}
