export type GameStatus = "HOME" | "ACTIVE" | "GAME_OVER";
export type GameplayTab = "BOARD" | "WHEEL" | "SHOP" | "RULES";
export type ShopTab = "BUY" | "SELL";
export type QuestionRuntimeState =
  | "AVAILABLE"
  | "CORRECT"
  | "INCORRECT"
  | "UNAVAILABLE";
export type QuestionStateById = Record<string, QuestionRuntimeState>;

export const BASE_SPIN_COST = 20;

export type GameState = {
  gameStatus: GameStatus;
  playerCoins: number;
  activeTab: GameplayTab;
  activeShopTab: ShopTab;
  questionStates: QuestionStateById;
  ownedRewardIds: string[];
  soldRewardIds: string[];
  wheelRewardIds: string[];
  shopRewardIds: string[];
  spentWheelRewardIds: string[];
  activeQuestionId: string | null;
  isWheelSpinning: boolean;
  spinSnapshotSegmentIds: string[] | null;
  selectedSpinSegmentId: string | null;
  selectedSpinRewardId: string | null;
  spinOutcome: "REWARD" | "EMPTY" | null;
  wheelRotationDeg: number;
  correctStreakCount: number;
  isStreakBonusActive: boolean;
  nextSpinCost: number;
};
