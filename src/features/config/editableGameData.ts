import type {
  GameConfig,
  PowerUpType,
  RewardCoinValue,
  RewardConfig,
  RewardType,
} from "./configTypes";

export type EditableGameData = {
  version: number;
  board: {
    columns: Array<{
      id: string;
      title: string;
      x: number;
      cells: Array<{
        id: string;
        coordinate: { x: number; y: number };
        value: number;
        question: string;
        answer: string;
        powerUp?: { type: PowerUpType };
      }>;
    }>;
  };
  rewards: Array<{
    id: string;
    name: string;
    value: RewardCoinValue;
    type?: RewardType;
  }>;
  rewardValueOptions: RewardCoinValue[];
};

export function cloneEditableGameData(data: EditableGameData): EditableGameData {
  return {
    version: data.version,
    board: {
      columns: data.board.columns.map((column) => ({
        ...column,
        cells: column.cells.map((cell) => ({
          ...cell,
          coordinate: { ...cell.coordinate },
          ...(cell.powerUp ? { powerUp: { ...cell.powerUp } } : {}),
        })),
      })),
    },
    rewards: data.rewards.map((reward) => ({ ...reward })),
    rewardValueOptions: [...data.rewardValueOptions],
  };
}

export function editableGameDataFromConfig(config: GameConfig): EditableGameData {
  return {
    version: config.version,
    board: {
      columns: config.topics
        .map((topic) => ({
          id: topic.id,
          title: topic.name,
          x: topic.order,
          cells: config.questions
            .filter((question) => question.topicId === topic.id)
            .map((question) => ({
              id: question.id,
              coordinate: { ...question.coordinate },
              value: question.coinValue,
              question: question.questionText,
              answer: question.answerText,
              ...(question.powerUp
                ? { powerUp: { type: question.powerUp.type } }
                : {}),
            }))
            .sort((a, b) => a.coordinate.y - b.coordinate.y),
        }))
        .sort((a, b) => a.x - b.x),
    },
    rewards: config.rewards.map((reward) => ({
      id: reward.id,
      name: reward.name,
      value: reward.coinValue,
      type: reward.type,
    })),
    rewardValueOptions: [...config.rewardValueOptions],
  };
}

export function withQuestionEdit(
  data: EditableGameData,
  questionId: string,
  question: string,
  answer: string,
  powerUpType: PowerUpType | null,
): EditableGameData {
  const nextData = cloneEditableGameData(data);
  nextData.board.columns = nextData.board.columns.map((column) => ({
    ...column,
    cells: column.cells.map((cell) => {
      if (cell.id !== questionId) return cell;
      return {
        ...cell,
        question,
        answer,
        ...(powerUpType
          ? { powerUp: { type: powerUpType } }
          : { powerUp: undefined }),
      };
    }),
  }));
  return nextData;
}

export function withRewardEdits(
  data: EditableGameData,
  rewards: Array<{
    rewardId: string;
    name: string;
    value: RewardCoinValue;
    type: RewardType;
  }>,
): EditableGameData {
  const editsById = new Map(rewards.map((reward) => [reward.rewardId, reward]));
  const nextData = cloneEditableGameData(data);
  nextData.rewards = nextData.rewards.map((reward) => {
    const edit = editsById.get(reward.id);
    if (!edit) return reward;
    return {
      ...reward,
      name: edit.name,
      value: edit.value,
      type: edit.type,
    };
  });
  return nextData;
}

export function withAddedReward(
  data: EditableGameData,
  reward: RewardConfig,
): EditableGameData {
  const nextData = cloneEditableGameData(data);
  nextData.rewards = [
    ...nextData.rewards,
    {
      id: reward.id,
      name: reward.name,
      value: reward.coinValue,
      type: reward.type,
    },
  ];
  return nextData;
}

export function withDeletedReward(
  data: EditableGameData,
  rewardId: string,
): EditableGameData {
  const nextData = cloneEditableGameData(data);
  nextData.rewards = nextData.rewards.filter((reward) => reward.id !== rewardId);
  return nextData;
}
