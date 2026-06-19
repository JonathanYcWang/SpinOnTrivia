import { isBrowser } from "@/lib/storage";
import { REWARD_COIN_VALUES } from "./configTypes";
import type {
  GameConfig,
  QuestionCoinValue,
  RewardConfig,
  RewardCoinValue,
} from "./configTypes";

export const EDIT_OVERRIDES_STORAGE_KEY = "jeopardy-wheel-edit-overrides";

export type EditOverrides = {
  questionsById: Record<
    string,
    {
      question?: string;
      answer?: string;
    }
  >;
  rewardsById: Record<
    string,
    {
      name?: string;
      value?: RewardCoinValue;
    }
  >;
  addedRewards: RewardConfig[];
};

export type EditOverridesLoadResult =
  | { status: "loaded"; overrides: EditOverrides; warning: "" }
  | { status: "missing"; overrides: EditOverrides; warning: "" }
  | { status: "malformed"; overrides: EditOverrides; warning: string };

export const EMPTY_EDIT_OVERRIDES: EditOverrides = {
  questionsById: {},
  rewardsById: {},
  addedRewards: [],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isRewardCoinValue(value: unknown): value is RewardCoinValue {
  return REWARD_COIN_VALUES.includes(value as RewardCoinValue);
}

function cloneOverrides(overrides: EditOverrides): EditOverrides {
  return {
    questionsById: Object.fromEntries(
      Object.entries(overrides.questionsById).map(([id, override]) => [
        id,
        { ...override },
      ]),
    ),
    rewardsById: Object.fromEntries(
      Object.entries(overrides.rewardsById).map(([id, override]) => [
        id,
        { ...override },
      ]),
    ),
    addedRewards: overrides.addedRewards.map((reward) => ({ ...reward })),
  };
}

function normalizeOverrides(value: unknown): EditOverrides | null {
  if (!isRecord(value)) return null;
  const questionsById = isRecord(value.questionsById)
    ? value.questionsById
    : {};
  const rewardsById = isRecord(value.rewardsById) ? value.rewardsById : {};
  const addedRewards = Array.isArray(value.addedRewards)
    ? value.addedRewards
    : [];

  const normalized: EditOverrides = cloneOverrides(EMPTY_EDIT_OVERRIDES);

  Object.entries(questionsById).forEach(([id, rawOverride]) => {
    if (!isRecord(rawOverride)) return;
    const question =
      typeof rawOverride.question === "string"
        ? rawOverride.question.trim()
        : undefined;
    const answer =
      typeof rawOverride.answer === "string"
        ? rawOverride.answer.trim()
        : undefined;
    const override: { question?: string; answer?: string } = {};
    if (question) override.question = question;
    if (answer) override.answer = answer;
    if (Object.keys(override).length > 0) normalized.questionsById[id] = override;
  });

  Object.entries(rewardsById).forEach(([id, rawOverride]) => {
    if (!isRecord(rawOverride)) return;
    const name =
      typeof rawOverride.name === "string" ? rawOverride.name.trim() : undefined;
    const value =
      typeof rawOverride.value === "number" ? rawOverride.value : undefined;
    const override: { name?: string; value?: RewardCoinValue } = {};
    if (name) override.name = name;
    if (value) override.value = value as RewardCoinValue;
    if (Object.keys(override).length > 0) normalized.rewardsById[id] = override;
  });

  addedRewards.forEach((rawReward) => {
    if (!isRecord(rawReward)) return;
    const id = typeof rawReward.id === "string" ? rawReward.id.trim() : "";
    const name =
      typeof rawReward.name === "string" ? rawReward.name.trim() : "";
    const value =
      typeof rawReward.coinValue === "number"
        ? rawReward.coinValue
        : typeof rawReward.value === "number"
          ? rawReward.value
          : null;
    if (!id || !name || !isRewardCoinValue(value)) return;
    normalized.addedRewards.push({
      id,
      name,
      description:
        typeof rawReward.description === "string"
          ? rawReward.description
          : "",
      coinValue: value as RewardCoinValue,
    });
  });

  return normalized;
}

export function loadEditOverrides(): EditOverridesLoadResult {
  if (!isBrowser()) {
    return {
      status: "missing",
      overrides: cloneOverrides(EMPTY_EDIT_OVERRIDES),
      warning: "",
    };
  }

  const raw = window.localStorage.getItem(EDIT_OVERRIDES_STORAGE_KEY);
  if (!raw) {
    return {
      status: "missing",
      overrides: cloneOverrides(EMPTY_EDIT_OVERRIDES),
      warning: "",
    };
  }

  try {
    const normalized = normalizeOverrides(JSON.parse(raw));
    if (!normalized) {
      return {
        status: "malformed",
        overrides: cloneOverrides(EMPTY_EDIT_OVERRIDES),
        warning: "Saved edit overrides are malformed and were ignored.",
      };
    }
    return { status: "loaded", overrides: normalized, warning: "" };
  } catch {
    return {
      status: "malformed",
      overrides: cloneOverrides(EMPTY_EDIT_OVERRIDES),
      warning: "Saved edit overrides are not valid JSON and were ignored.",
    };
  }
}

export function saveEditOverrides(overrides: EditOverrides) {
  if (!isBrowser()) return;
  window.localStorage.setItem(
    EDIT_OVERRIDES_STORAGE_KEY,
    JSON.stringify(overrides),
  );
}

export function applyEditOverrides(
  config: GameConfig,
  overrides: EditOverrides,
): GameConfig {
  return {
    ...config,
    topics: config.topics.map((topic) => ({ ...topic })),
    questions: config.questions.map((question) => {
      const override = overrides.questionsById[question.id];
      return {
        ...question,
        coordinate: { ...question.coordinate },
        questionText: override?.question ?? question.questionText,
        answerText: override?.answer ?? question.answerText,
      };
    }),
    rewards: [...config.rewards, ...overrides.addedRewards].map((reward) =>
      applyRewardOverride(reward, config, overrides),
    ),
    rewardValueOptions: [...config.rewardValueOptions],
  };
}

function applyRewardOverride(
  reward: RewardConfig,
  config: GameConfig,
  overrides: EditOverrides,
): RewardConfig {
  const override = overrides.rewardsById[reward.id];
  const overrideValue = override?.value;
  const valueIsAllowed =
    typeof overrideValue === "number" &&
    config.rewardValueOptions.includes(overrideValue);
  return {
    ...reward,
    name: override?.name ?? reward.name,
    coinValue: valueIsAllowed ? overrideValue : reward.coinValue,
  };
}

export function withQuestionOverride(
  overrides: EditOverrides,
  questionId: string,
  question: string,
  answer: string,
): EditOverrides {
  return {
    ...cloneOverrides(overrides),
    questionsById: {
      ...overrides.questionsById,
      [questionId]: { question, answer },
    },
  };
}

export function withRewardOverride(
  overrides: EditOverrides,
  rewardId: string,
  name: string,
  value: RewardCoinValue,
): EditOverrides {
  return {
    ...cloneOverrides(overrides),
    rewardsById: {
      ...overrides.rewardsById,
      [rewardId]: { name, value },
    },
  };
}

export function withRewardOverrides(
  overrides: EditOverrides,
  rewards: Array<{ rewardId: string; name: string; value: RewardCoinValue }>,
): EditOverrides {
  return {
    ...cloneOverrides(overrides),
    rewardsById: {
      ...overrides.rewardsById,
      ...Object.fromEntries(
        rewards.map((reward) => [
          reward.rewardId,
          { name: reward.name, value: reward.value },
        ]),
      ),
    },
  };
}

export function withAddedReward(
  overrides: EditOverrides,
  reward: RewardConfig,
): EditOverrides {
  return {
    ...cloneOverrides(overrides),
    addedRewards: [...overrides.addedRewards, { ...reward }],
  };
}

export function isAllowedQuestionValue(value: number): value is QuestionCoinValue {
  return value === 5 || value === 10 || value === 15 || value === 20;
}
