import { describe, expect, it } from "vitest";
import { validConfig } from "@/test/fixtures/configs";
import {
  editableGameDataFromConfig,
  withAddedReward,
  withDeletedReward,
  withQuestionEdit,
  withRewardEdits,
} from "./editableGameData";

describe("editable game data", () => {
  it("updates question text and power ups in JSON data", () => {
    const data = editableGameDataFromConfig(validConfig);
    const nextData = withQuestionEdit(
      data,
      "question-food-5",
      "Red fruit?",
      "Apple",
      "BONUS_ON_CORRECT",
    );

    const cell = nextData.board.columns
      .flatMap((column) => column.cells)
      .find((question) => question.id === "question-food-5");
    expect(cell).toBeDefined();
    if (!cell) return;
    expect(cell.question).toBe("Red fruit?");
    expect(cell.answer).toBe("Apple");
    expect(cell.powerUp).toEqual({ type: "BONUS_ON_CORRECT" });
  });

  it("clears question power ups in JSON data", () => {
    const data = editableGameDataFromConfig(validConfig);
    const nextData = withQuestionEdit(
      data,
      "question-history-20",
      "Capital of Canada?",
      "Ottawa",
      null,
    );

    const cell = nextData.board.columns
      .flatMap((column) => column.cells)
      .find((question) => question.id === "question-history-20");
    expect(cell?.powerUp).toBeUndefined();
  });

  it("adds, edits, and deletes rewards in JSON data", () => {
    const data = editableGameDataFromConfig(validConfig);
    const addedData = withAddedReward(data, {
      id: "reward-added",
      name: "Added",
      description: "",
      coinValue: 60,
      type: "SELLABLE",
    });
    const editedData = withRewardEdits(addedData, [
      {
        rewardId: "reward-added",
        name: "Edited",
        value: 50,
        type: "UNSELLABLE",
      },
    ]);
    const deletedData = withDeletedReward(editedData, "reward-added");

    expect(editedData.rewards.find((reward) => reward.id === "reward-added")).toEqual(
      {
        id: "reward-added",
        name: "Edited",
        value: 50,
        type: "UNSELLABLE",
      },
    );
    expect(deletedData.rewards.map((reward) => reward.id)).not.toContain(
      "reward-added",
    );
  });
});
