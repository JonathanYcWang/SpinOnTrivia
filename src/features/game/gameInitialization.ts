import type { GameConfig } from "@/features/config/configTypes";
import { BASE_SPIN_COST, type GameState } from "./gameTypes";

export function initializeGameState(config: GameConfig): GameState {
  return {
    gameStatus: "ACTIVE",
    playerCoins: 0,
    activeTab: "BOARD",
    activeShopTab: "BUY",
    questionStates: Object.fromEntries(
      config.questions.map((question) => [question.id, "AVAILABLE"]),
    ),
    ownedRewardIds: [],
    soldRewardIds: [],
    wheelRewardIds: config.rewards.map((reward) => reward.id),
    shopRewardIds: config.rewards.map((reward) => reward.id),
    spentWheelRewardIds: [],
    activeQuestionId: null,
    isWheelSpinning: false,
    spinSnapshotSegmentIds: null,
    selectedSpinSegmentId: null,
    selectedSpinRewardId: null,
    spinOutcome: null,
    wheelRotationDeg: 0,
    correctStreakCount: 0,
    isStreakBonusActive: false,
    nextSpinCost: BASE_SPIN_COST,
  };
}
