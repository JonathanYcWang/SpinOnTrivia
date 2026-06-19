import type { GameConfig } from "@/features/config/configTypes";

export const validConfig: GameConfig = {
  version: 1,
  topics: [
    { id: "topic-history", name: "History", order: 0 },
    { id: "topic-food", name: "Food", order: 1 },
  ],
  questions: [
    {
      id: "question-history-20",
      topicId: "topic-history",
      coinValue: 20,
      coordinate: { x: 0, y: 3 },
      questionText: "Capital of Canada?",
      answerText: "Ottawa",
    },
    {
      id: "question-food-5",
      topicId: "topic-food",
      coinValue: 20,
      coordinate: { x: 1, y: 3 },
      questionText: "Red fruit?",
      answerText: "Apple",
    },
  ],
  rewards: [
    {
      id: "reward-tea",
      name: "Tea",
      description: "A warm drink",
      coinValue: 40,
      type: "SELLABLE",
    },
    {
      id: "reward-toast",
      name: "Toast",
      description: "A crisp snack",
      coinValue: 50,
      type: "SELLABLE",
    },
  ],
  rewardValueOptions: [30, 40, 50, 60, 70, 80, 90, 100],
};

export const minimalConfig: GameConfig = {
  version: 1,
  topics: [{ id: "topic-one", name: "Topic One", order: 0 }],
  questions: [
    {
      id: "question-one",
      topicId: "topic-one",
      coinValue: 20,
      coordinate: { x: 0, y: 3 },
      questionText: "Question?",
      answerText: "Answer",
    },
  ],
  rewards: [
    {
      id: "reward-one",
      name: "Reward One",
      description: "Long enough reward description ".repeat(5),
      coinValue: 40,
      type: "SELLABLE",
    },
  ],
  rewardValueOptions: [30, 40, 50, 60, 70, 80, 90, 100],
};
