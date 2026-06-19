export const QUESTION_COIN_VALUES = [10, 20, 30, 40] as const;
export type QuestionCoinValue = (typeof QUESTION_COIN_VALUES)[number];

export const REWARD_COIN_VALUES = [30, 40, 50, 60, 70, 80, 90, 100] as const;
export type RewardCoinValue = (typeof REWARD_COIN_VALUES)[number];
export const REWARD_TYPES = ["SELLABLE", "UNSELLABLE"] as const;
export type RewardType = (typeof REWARD_TYPES)[number];

export const POWER_UP_TYPES = [
  "DOUBLE_BALANCE_ON_CORRECT",
  "HALVE_BALANCE_ON_INCORRECT",
  "BONUS_ON_CORRECT",
  "DOUBLE_SPIN_COST_ON_INCORRECT",
  "HALVE_SPIN_COST_ON_CORRECT",
] as const;
export type PowerUpType = (typeof POWER_UP_TYPES)[number];

export type EntityId = string;
export type GameConfigVersion = 1;

export type PowerUpConfig = {
  type: PowerUpType;
};

export type TopicConfig = {
  id: EntityId;
  name: string;
  order: number;
};

export type QuestionConfig = {
  id: EntityId;
  topicId: EntityId;
  coinValue: QuestionCoinValue;
  coordinate: { x: number; y: number };
  questionText: string;
  answerText: string;
  powerUp?: PowerUpConfig;
};

export type RewardConfig = {
  id: EntityId;
  name: string;
  description: string;
  coinValue: RewardCoinValue;
  type: RewardType;
};

export type GameConfig = {
  version: GameConfigVersion;
  topics: TopicConfig[];
  questions: QuestionConfig[];
  rewards: RewardConfig[];
  rewardValueOptions: RewardCoinValue[];
};
