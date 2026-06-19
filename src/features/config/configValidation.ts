import gameData from "./game-data.json";
import {
  QUESTION_COIN_VALUES,
  POWER_UP_TYPES,
  REWARD_COIN_VALUES,
  REWARD_TYPES,
  type GameConfig,
  type PowerUpConfig,
  type PowerUpType,
  type QuestionCoinValue,
  type RewardCoinValue,
  type RewardType,
} from "./configTypes";

export type FieldError = {
  entityId: string;
  field: string;
  message: string;
};

export type GameDataValidationResult =
  | { valid: true; data: unknown; config: GameConfig }
  | { valid: false; fieldErrors: FieldError[] };

export type ConfigValidationResult =
  | { valid: true; config: GameConfig }
  | { valid: false; fieldErrors: FieldError[] };

type RawCell = {
  id: unknown;
  coordinate: { x: unknown; y: unknown };
  value: unknown;
  question: unknown;
  answer: unknown;
  powerUp?: unknown;
};

type RawColumn = {
  id: unknown;
  title: unknown;
  x: unknown;
  cells: unknown;
};

type RawReward = {
  id: unknown;
  name: unknown;
  value: unknown;
  type?: unknown;
};

function isQuestionCoinValue(value: unknown): value is QuestionCoinValue {
  return QUESTION_COIN_VALUES.includes(value as QuestionCoinValue);
}

function isRewardCoinValue(value: unknown): value is RewardCoinValue {
  return REWARD_COIN_VALUES.includes(value as RewardCoinValue);
}

function isRewardType(value: unknown): value is RewardType {
  return REWARD_TYPES.includes(value as RewardType);
}

function isPowerUpType(value: unknown): value is PowerUpType {
  return POWER_UP_TYPES.includes(value as (typeof POWER_UP_TYPES)[number]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function trimString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function fieldError(entityId: unknown, field: string, message: string) {
  return {
    entityId: typeof entityId === "string" && entityId ? entityId : "game-data",
    field,
    message,
  };
}

export function validateGameData(value: unknown): ConfigValidationResult {
  const fieldErrors: FieldError[] = [];

  if (!isRecord(value)) {
    return {
      valid: false,
      fieldErrors: [
        fieldError("game-data", "shape", "Game data must be an object."),
      ],
    };
  }

  const board = value.board;
  const columns = isRecord(board) ? board.columns : null;
  const rewards = value.rewards;
  const rewardValueOptions = value.rewardValueOptions;

  if (!Array.isArray(columns)) {
    fieldErrors.push(
      fieldError("board", "columns", "Board columns are required."),
    );
  } else if (columns.length !== 5) {
    fieldErrors.push(
      fieldError("board", "columns", "Board must have exactly 5 columns."),
    );
  }

  if (!Array.isArray(rewards) || rewards.length < 1) {
    fieldErrors.push(
      fieldError("rewards", "rewards", "At least 1 reward is required."),
    );
  }

  const validRewardValueOptions = Array.isArray(rewardValueOptions)
    ? rewardValueOptions.filter(isRewardCoinValue)
    : [];
  if (
    !Array.isArray(rewardValueOptions) ||
    rewardValueOptions.length === 0 ||
    validRewardValueOptions.length !== rewardValueOptions.length
  ) {
    fieldErrors.push(
      fieldError(
        "rewardValueOptions",
        "rewardValueOptions",
        "Reward value options must be valid reward values.",
      ),
    );
  }

  const topicIds = new Set<string>();
  const columnXs = new Set<number>();
  const questionIds = new Set<string>();
  const coordinates = new Set<string>();

  if (Array.isArray(columns)) {
    columns.forEach((rawColumn) => {
      const column = rawColumn as RawColumn;
      const columnId = trimString(column.id);
      const title = trimString(column.title);

      if (!columnId) {
        fieldErrors.push(fieldError(column.id, "id", "Topic ID is required."));
      } else if (topicIds.has(columnId)) {
        fieldErrors.push(
          fieldError(columnId, "id", "Topic ID must be unique."),
        );
      } else {
        topicIds.add(columnId);
      }

      if (!title) {
        fieldErrors.push(
          fieldError(columnId, "title", "Topic title is required."),
        );
      }

      if (
        typeof column.x !== "number" ||
        !Number.isInteger(column.x) ||
        column.x < 0 ||
        column.x > 4
      ) {
        fieldErrors.push(
          fieldError(columnId, "x", "Column x must be between 0 and 4."),
        );
      } else if (columnXs.has(column.x)) {
        fieldErrors.push(
          fieldError(columnId, "x", "Column x values must be unique."),
        );
      } else {
        columnXs.add(column.x);
      }

      if (!Array.isArray(column.cells)) {
        fieldErrors.push(
          fieldError(columnId, "cells", "Column cells are required."),
        );
        return;
      }

      if (column.cells.length !== 4) {
        fieldErrors.push(
          fieldError(columnId, "cells", "Each column must have exactly 4 rows."),
        );
      }

      const rowValues = new Set<QuestionCoinValue>();
      const rowYs = new Set<number>();

      column.cells.forEach((rawCell) => {
        const cell = rawCell as RawCell;
        const cellId = trimString(cell.id);
        const coordinate = cell.coordinate;

        if (!cellId) {
          fieldErrors.push(fieldError(cell.id, "id", "Question ID is required."));
        } else if (questionIds.has(cellId)) {
          fieldErrors.push(
            fieldError(cellId, "id", "Question ID must be unique."),
          );
        } else {
          questionIds.add(cellId);
        }

        if (!isQuestionCoinValue(cell.value)) {
          fieldErrors.push(
            fieldError(
              cellId,
              "value",
              "Question value must be 5, 10, 15, or 20.",
            ),
          );
        } else if (rowValues.has(cell.value)) {
          fieldErrors.push(
            fieldError(
              cellId,
              "value",
              "Each column must contain each question value once.",
            ),
          );
        } else {
          rowValues.add(cell.value);
        }

        if (!trimString(cell.question)) {
          fieldErrors.push(
            fieldError(cellId, "question", "Question is required."),
          );
        }

        if (!trimString(cell.answer)) {
          fieldErrors.push(fieldError(cellId, "answer", "Answer is required."));
        }

        if (cell.powerUp !== undefined) {
          if (!isRecord(cell.powerUp)) {
            fieldErrors.push(
              fieldError(cellId, "powerUp", "Power up must be an object."),
            );
          } else if (!isPowerUpType(cell.powerUp.type)) {
            fieldErrors.push(
              fieldError(
                cellId,
                "powerUp",
                "Power up type must be a supported value.",
              ),
            );
          }
        }

        if (!isRecord(coordinate)) {
          fieldErrors.push(
            fieldError(cellId, "coordinate", "Question coordinate is required."),
          );
          return;
        }

        const x = coordinate.x;
        const y = coordinate.y;
        if (x !== column.x) {
          fieldErrors.push(
            fieldError(
              cellId,
              "coordinate",
              "Question coordinate x must match its column.",
            ),
          );
        }

        if (
          typeof y !== "number" ||
          !Number.isInteger(y) ||
          y < 0 ||
          y > 3
        ) {
          fieldErrors.push(
            fieldError(cellId, "coordinate", "Question y must be between 0 and 3."),
          );
          return;
        }

        if (rowYs.has(y)) {
          fieldErrors.push(
            fieldError(cellId, "coordinate", "Question y values must be unique."),
          );
        } else {
          rowYs.add(y);
        }

        const coordinateKey = `${x}:${y}`;
        if (coordinates.has(coordinateKey)) {
          fieldErrors.push(
            fieldError(cellId, "coordinate", "Question coordinates must be unique."),
          );
        } else {
          coordinates.add(coordinateKey);
        }
      });

      QUESTION_COIN_VALUES.forEach((value) => {
        if (!rowValues.has(value)) {
          fieldErrors.push(
            fieldError(
              columnId,
              "value",
              "Each column must contain 5, 10, 15, and 20.",
            ),
          );
        }
      });
    });
  }

  const rewardIds = new Set<string>();
  if (Array.isArray(rewards)) {
    rewards.forEach((rawReward) => {
      const reward = rawReward as RawReward;
      const rewardId = trimString(reward.id);
      const rewardName = trimString(reward.name);

      if (!rewardId) {
        fieldErrors.push(
          fieldError(reward.id, "id", "Reward ID is required."),
        );
      } else if (rewardIds.has(rewardId)) {
        fieldErrors.push(
          fieldError(rewardId, "id", "Reward ID must be unique."),
        );
      } else {
        rewardIds.add(rewardId);
      }

      if (!rewardName) {
        fieldErrors.push(
          fieldError(rewardId, "name", "Reward name is required."),
        );
      }

      if (
        !isRewardCoinValue(reward.value) ||
        !validRewardValueOptions.includes(reward.value as RewardCoinValue)
      ) {
        fieldErrors.push(
          fieldError(
            rewardId,
            "value",
            "Reward value must be one of the configured reward value options.",
          ),
        );
      }

      if (reward.type !== undefined && !isRewardType(reward.type)) {
        fieldErrors.push(
          fieldError(
            rewardId,
            "type",
            "Reward type must be a supported value.",
          ),
        );
      }
    });
  }

  if (fieldErrors.length > 0) return { valid: false, fieldErrors };

  return {
    valid: true,
    config: gameDataToConfig(value),
  };
}

export function validateEditableGameData(
  value: unknown,
): GameDataValidationResult {
  const validation = validateGameData(value);
  if (!validation.valid) return validation;
  return { valid: true, data: value, config: validation.config };
}

function gameDataToConfig(value: Record<string, unknown>): GameConfig {
  const board = value.board as { columns: RawColumn[] };
  const rewardValueOptions = value.rewardValueOptions as RewardCoinValue[];
  const topics = board.columns
    .map((column) => ({
      id: column.id as string,
      name: trimString(column.title),
      order: column.x as number,
    }))
    .sort((a, b) => a.order - b.order);

  const questions = board.columns.flatMap((column) =>
    (column.cells as RawCell[]).map((cell) => {
      const powerUp = isRecord(cell.powerUp)
        ? ({ type: cell.powerUp.type } as PowerUpConfig)
        : undefined;
      return {
        id: cell.id as string,
        topicId: column.id as string,
        coinValue: cell.value as QuestionCoinValue,
        coordinate: {
          x: (cell.coordinate as { x: number; y: number }).x,
          y: (cell.coordinate as { x: number; y: number }).y,
        },
        questionText: trimString(cell.question),
        answerText: trimString(cell.answer),
        ...(powerUp ? { powerUp } : {}),
      };
    }),
  );

  const rewards = (value.rewards as RawReward[]).map((reward) => ({
    id: reward.id as string,
    name: trimString(reward.name),
    description: "",
    coinValue: reward.value as RewardCoinValue,
    type: isRewardType(reward.type) ? reward.type : "SELLABLE",
  }));

  return {
    version: 1,
    topics,
    questions,
    rewards,
    rewardValueOptions,
  };
}

export function getBaseGameConfig(): ConfigValidationResult {
  return validateGameData(gameData);
}

export function validateConfigForGameStart(
  config: GameConfig,
): ConfigValidationResult {
  const fieldErrors: FieldError[] = [];
  if (config.topics.length !== 5) {
    fieldErrors.push(
      fieldError("game-start", "topics", "Exactly 5 topics are required."),
    );
  }
  if (config.questions.length !== 20) {
    fieldErrors.push(
      fieldError("game-start", "questions", "Exactly 20 questions are required."),
    );
  }
  if (config.rewards.length < 1) {
    fieldErrors.push(
      fieldError("game-start", "rewards", "At least 1 reward is required."),
    );
  }
  if (fieldErrors.length > 0) return { valid: false, fieldErrors };
  return { valid: true, config };
}

export function getFieldError(
  errors: FieldError[],
  entityId: string,
  field: string,
) {
  return errors.find(
    (error) => error.entityId === entityId && error.field === field,
  )?.message;
}
