import { describe, expect, it } from "vitest";
import gameData from "./game-data.json";
import { validateGameData } from "./configValidation";

function cloneGameData() {
  return structuredClone(gameData);
}

describe("game data validation", () => {
  it("accepts the shipped baseline data", () => {
    expect(validateGameData(gameData).valid).toBe(true);
  });

  it("rejects fewer or more than 5 columns", () => {
    const data = cloneGameData();
    data.board.columns = data.board.columns.slice(0, 4);
    expect(validateGameData(data).valid).toBe(false);

    const tooMany = cloneGameData();
    tooMany.board.columns.push({
      id: "topic-extra",
      title: "Extra",
      x: 5,
      cells: [],
    });
    expect(validateGameData(tooMany).valid).toBe(false);
  });

  it("rejects fewer or more than 4 rows per column", () => {
    const data = cloneGameData();
    data.board.columns[0].cells = data.board.columns[0].cells.slice(0, 3);
    expect(validateGameData(data).valid).toBe(false);
  });

  it("rejects duplicate coordinates", () => {
    const data = cloneGameData();
    data.board.columns[0].cells[1].coordinate = {
      ...data.board.columns[0].cells[0].coordinate,
    };
    expect(validateGameData(data).valid).toBe(false);
  });

  it("rejects empty question and answer text", () => {
    const data = cloneGameData();
    data.board.columns[0].cells[0].question = "";
    data.board.columns[0].cells[0].answer = "";
    const result = validateGameData(data);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fieldErrors.map((error) => error.field)).toEqual(
        expect.arrayContaining(["question", "answer"]),
      );
    }
  });

  it("rejects empty reward name and invalid reward value", () => {
    const data = cloneGameData();
    data.rewards[0].name = "";
    data.rewards[0].value = 15;
    const result = validateGameData(data);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fieldErrors.map((error) => error.field)).toEqual(
        expect.arrayContaining(["name", "value"]),
      );
    }
  });

  it("accepts supported reward types", () => {
    const data = cloneGameData();
    (data.rewards[0] as { type?: string }).type = "UNSELLABLE";
    const result = validateGameData(data);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.config.rewards[0].type).toBe("UNSELLABLE");
    }
  });

  it("rejects unknown reward types", () => {
    const data = cloneGameData();
    (data.rewards[0] as { type?: string }).type = "LIMITED";
    const result = validateGameData(data);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fieldErrors.map((error) => error.field)).toContain("type");
    }
  });

  it("accepts valid power-up types", () => {
    const data = cloneGameData();
    (data.board.columns[0].cells[0] as { powerUp?: { type: string } }).powerUp = {
      type: "DOUBLE_SPIN_COST_ON_INCORRECT",
    };
    expect(validateGameData(data).valid).toBe(true);

    (data.board.columns[0].cells[0] as { powerUp?: { type: string } }).powerUp = {
      type: "HALVE_SPIN_COST_ON_CORRECT",
    };
    expect(validateGameData(data).valid).toBe(true);
  });

  it("rejects unknown power-up types", () => {
    const data = cloneGameData();
    (data.board.columns[0].cells[0] as { powerUp?: { type: string } }).powerUp = {
      type: "UNKNOWN_POWER_UP",
    };
    const result = validateGameData(data);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.fieldErrors.map((error) => error.field)).toContain(
        "powerUp",
      );
    }
  });

  it("rejects removed mystery gift power-up type", () => {
    const data = cloneGameData();
    (data.board.columns[0].cells[0] as { powerUp?: { type: string } }).powerUp = {
      type: "MYSTERY_GIFT",
    };
    expect(validateGameData(data).valid).toBe(false);
  });

});
