import type {
  GameConfig,
  QuestionCoinValue,
  RewardConfig,
} from "@/features/config/configTypes";
import { QUESTION_COIN_VALUES } from "@/features/config/configTypes";
import { sortRewards } from "@/lib/sorting";
import type { GameState } from "./gameTypes";

const SPIN_COST = 20;
const SALES_TAX = 0.5;

export function getTopicById(config: GameConfig, topicId: string) {
  return config.topics.find((topic) => topic.id === topicId);
}

export function getQuestionById(config: GameConfig, questionId: string) {
  return config.questions.find((question) => question.id === questionId);
}

export function getRewardById(config: GameConfig, rewardId: string) {
  return config.rewards.find((reward) => reward.id === rewardId);
}

export function getQuestionsByTopicAndValue(config: GameConfig) {
  const map = new Map<string, (typeof config.questions)[number]>();
  config.questions.forEach((question) => {
    map.set(`${question.topicId}:${question.coinValue}`, question);
  });
  return map;
}

export function getBoardCellState(
  config: GameConfig,
  state: GameState,
  topicId: string,
  value: QuestionCoinValue,
) {
  const question = getQuestionsByTopicAndValue(config).get(
    `${topicId}:${value}`,
  );
  if (!question)
    return { runtimeState: "UNAVAILABLE" as const, question: null };
  return {
    runtimeState: state.questionStates[question.id] ?? "UNAVAILABLE",
    question,
  };
}

export function getBoardCellStateByQuestion(
  state: GameState,
  question: GameConfig["questions"][number],
) {
  return {
    runtimeState: state.questionStates[question.id] ?? "UNAVAILABLE",
    question,
  };
}

export function getAvailableQuestions(config: GameConfig, state: GameState) {
  return config.questions.filter(
    (question) => state.questionStates[question.id] === "AVAILABLE",
  );
}

export function getUnansweredQuestions(config: GameConfig, state: GameState) {
  return getAvailableQuestions(config, state);
}

export function getWheelRewards(config: GameConfig, state: GameState) {
  return state.wheelRewardIds
    .map((id) => getRewardById(config, id))
    .filter((reward): reward is RewardConfig => Boolean(reward));
}

export function getAvailableWheelRewards(config: GameConfig, state: GameState) {
  return getWheelRewards(config, state).filter(
    (reward) => !state.spentWheelRewardIds.includes(reward.id),
  );
}

export function getShopBuyRewards(config: GameConfig, state: GameState) {
  return state.shopRewardIds
    .map((id) => getRewardById(config, id))
    .filter((reward): reward is RewardConfig => Boolean(reward))
    .sort(sortRewards);
}

export function getOwnedRewards(config: GameConfig, state: GameState) {
  return state.ownedRewardIds
    .map((id) => getRewardById(config, id))
    .filter((reward): reward is RewardConfig => Boolean(reward))
    .sort(sortRewards);
}

export function getSellValue(reward: RewardConfig) {
  return Math.max(reward.coinValue * SALES_TAX, 10);
}

export function canSpin(config: GameConfig, state: GameState) {
  return (
    state.playerCoins >= SPIN_COST &&
    getAvailableWheelRewards(config, state).length > 0 &&
    !state.isWheelSpinning
  );
}

export function canBuyReward(state: GameState, reward: RewardConfig) {
  return (
    state.gameStatus === "ACTIVE" &&
    state.playerCoins >= reward.coinValue &&
    state.wheelRewardIds.includes(reward.id) &&
    state.shopRewardIds.includes(reward.id) &&
    !state.ownedRewardIds.includes(reward.id) &&
    !state.soldRewardIds.includes(reward.id) &&
    !state.isWheelSpinning
  );
}

export function canSellReward(state: GameState, reward: RewardConfig) {
  return (
    state.ownedRewardIds.includes(reward.id) &&
    !state.soldRewardIds.includes(reward.id) &&
    !state.isSellingLocked &&
    !state.isWheelSpinning
  );
}

export function isGameOver(config: GameConfig, state: GameState): boolean {
  const availableWheelRewards = getAvailableWheelRewards(config, state);
  if (availableWheelRewards.length === 0) return true;

  const unansweredQuestions = getUnansweredQuestions(config, state);
  const ownedRewards = getOwnedRewards(config, state);
  const buyableRewardExists = getShopBuyRewards(config, state).some(
    (reward) => reward.coinValue <= state.playerCoins,
  );

  return (
    unansweredQuestions.length === 0 &&
    ownedRewards.length === 0 &&
    state.playerCoins < 5 &&
    !buyableRewardExists
  );
}

export { QUESTION_COIN_VALUES };
