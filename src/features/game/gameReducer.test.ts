import { describe, expect, it } from "vitest";
import { gameReducer } from "./gameReducer";
import { initializeGameState } from "./gameInitialization";
import { canSellReward, isGameOver } from "./gameSelectors";
import { validConfig } from "@/test/fixtures/configs";
import type { GameConfig, PowerUpType } from "@/features/config/configTypes";
import type { GameState } from "./gameTypes";

function configWithPowerUp(questionId: string, type: PowerUpType): GameConfig {
  return {
    ...validConfig,
    questions: validConfig.questions.map((question) =>
      question.id === questionId ? { ...question, powerUp: { type } } : question,
    ),
  };
}

function answerQuestion({
  config,
  questionId,
  result,
  playerCoins = 0,
  correctStreakCount = 0,
  isStreakBonusActive = false,
  nextSpinCost = 20,
}: {
  config: GameConfig;
  questionId: string;
  result: "CORRECT" | "INCORRECT";
  playerCoins?: number;
  correctStreakCount?: number;
  isStreakBonusActive?: boolean;
  nextSpinCost?: number;
}) {
  let state = {
    ...initializeGameState(config),
    playerCoins,
    correctStreakCount,
    isStreakBonusActive,
    nextSpinCost,
  };
  state = gameReducer(state, {
    type: "OPEN_QUESTION",
    questionId,
  });
  return gameReducer(state, {
    type: "MARK_QUESTION",
    questionId,
    result,
    config,
  });
}

describe("game reducer", () => {
  it("starts a new game with 0 coins", () => {
    expect(initializeGameState(validConfig).playerCoins).toBe(0);
  });

  it("correct answer adds coin value and incorrect leaves coins unchanged", () => {
    let state = initializeGameState(validConfig);
    state = gameReducer(state, {
      type: "OPEN_QUESTION",
      questionId: "question-history-20",
    });
    state = gameReducer(state, {
      type: "MARK_QUESTION",
      questionId: "question-history-20",
      result: "CORRECT",
      config: validConfig,
    });
    expect(state.playerCoins).toBe(20);
    state = gameReducer(state, {
      type: "OPEN_QUESTION",
      questionId: "question-food-5",
    });
    state = gameReducer(state, {
      type: "MARK_QUESTION",
      questionId: "question-food-5",
      result: "INCORRECT",
      config: validConfig,
    });
    expect(state.playerCoins).toBe(20);
  });

  it("completed questions cannot reopen", () => {
    let state = initializeGameState(validConfig);
    state = gameReducer(state, {
      type: "OPEN_QUESTION",
      questionId: "question-history-20",
    });
    state = gameReducer(state, {
      type: "MARK_QUESTION",
      questionId: "question-history-20",
      result: "CORRECT",
      config: validConfig,
    });
    state = gameReducer(state, {
      type: "OPEN_QUESTION",
      questionId: "question-history-20",
    });
    expect(state.activeQuestionId).toBeNull();
  });

  it("spin start deducts the spin cost and finish moves reward to owned while marking the wheel segment as spent", () => {
    let state = { ...initializeGameState(validConfig), playerCoins: 20 };
    state = gameReducer(state, {
      type: "START_SPIN",
      segmentId: "reward:reward-tea",
      rewardId: "reward-tea",
      spinSnapshotSegmentIds: state.wheelRewardIds.map((id) => `reward:${id}`),
      targetRotationDeg: 100,
      config: validConfig,
    });
    expect(state.playerCoins).toBe(0);
    state = gameReducer(state, { type: "FINISH_SPIN", config: validConfig });
    expect(state.ownedRewardIds).toContain("reward-tea");
    expect(state.spentWheelRewardIds).toContain("reward-tea");
    expect(state.wheelRewardIds).toContain("reward-tea");
    expect(state.shopRewardIds).not.toContain("reward-tea");
  });

  it("prevents changing gameplay tabs while the wheel is spinning", () => {
    let state: GameState = {
      ...initializeGameState(validConfig),
      activeTab: "WHEEL",
      playerCoins: 20,
    };
    state = gameReducer(state, {
      type: "START_SPIN",
      segmentId: "reward:reward-tea",
      rewardId: "reward-tea",
      spinSnapshotSegmentIds: state.wheelRewardIds.map((id) => `reward:${id}`),
      targetRotationDeg: 100,
      config: validConfig,
    });

    const nextState = gameReducer(state, {
      type: "SET_ACTIVE_TAB",
      tab: "SHOP",
    });

    expect(nextState.activeTab).toBe("WHEEL");
  });

  it("landing on an empty segment costs coins and awards nothing", () => {
    const initialState = { ...initializeGameState(validConfig), playerCoins: 20 };
    let state = gameReducer(initialState, {
      type: "START_SPIN",
      segmentId: "empty:0",
      rewardId: null,
      spinSnapshotSegmentIds: [
        ...initialState.wheelRewardIds.map((id) => `reward:${id}`),
        "empty:0",
      ],
      targetRotationDeg: 100,
      config: validConfig,
    });
    expect(state.playerCoins).toBe(0);

    state = gameReducer(state, { type: "FINISH_SPIN", config: validConfig });

    expect(state.spinOutcome).toBe("EMPTY");
    expect(state.ownedRewardIds).toEqual(initialState.ownedRewardIds);
    expect(state.shopRewardIds).toEqual(initialState.shopRewardIds);
    expect(state.spentWheelRewardIds).toEqual(initialState.spentWheelRewardIds);
  });

  it("landing on an already-spent segment is a no-op and shows empty outcome", () => {
    let state = { ...initializeGameState(validConfig), playerCoins: 20 };
    state = gameReducer(state, {
      type: "START_SPIN",
      segmentId: "reward:reward-tea",
      rewardId: "reward-tea",
      spinSnapshotSegmentIds: state.wheelRewardIds.map((id) => `reward:${id}`),
      targetRotationDeg: 100,
      config: validConfig,
    });
    state = gameReducer(state, { type: "FINISH_SPIN", config: validConfig });
    expect(
      state.ownedRewardIds.filter((id) => id === "reward-tea"),
    ).toHaveLength(1);
    state = { ...state, playerCoins: 20 };
    state = gameReducer(state, {
      type: "START_SPIN",
      segmentId: "reward:reward-tea",
      rewardId: "reward-tea",
      spinSnapshotSegmentIds: state.wheelRewardIds.map((id) => `reward:${id}`),
      targetRotationDeg: 100,
      config: validConfig,
    });
    state = gameReducer(state, { type: "FINISH_SPIN", config: validConfig });
    expect(state.spinOutcome).toBe("EMPTY");
    expect(
      state.ownedRewardIds.filter((id) => id === "reward-tea"),
    ).toHaveLength(1);
  });

  it("cannot spin without enough coins or buy unaffordable reward", () => {
    let state = initializeGameState(validConfig);
    expect(
      gameReducer(state, {
        type: "START_SPIN",
        segmentId: "reward:reward-tea",
        rewardId: "reward-tea",
        spinSnapshotSegmentIds: state.wheelRewardIds.map((id) => `reward:${id}`),
        targetRotationDeg: 100,
        config: validConfig,
      }),
    ).toBe(state);
    state = gameReducer(state, {
      type: "BUY_REWARD",
      rewardId: "reward-tea",
      config: validConfig,
    });
    expect(state.ownedRewardIds).toEqual([]);
  });

  it("buying removes reward from wheel and shop", () => {
    let state = { ...initializeGameState(validConfig), playerCoins: 40 };
    state = gameReducer(state, {
      type: "BUY_REWARD",
      rewardId: "reward-tea",
      config: validConfig,
    });
    expect(state.playerCoins).toBe(0);
    expect(state.ownedRewardIds).toContain("reward-tea");
    expect(state.wheelRewardIds).not.toContain("reward-tea");
    expect(state.shopRewardIds).not.toContain("reward-tea");
  });

  it("selling adds the displayed sell value and permanently removes reward", () => {
    let state = { ...initializeGameState(validConfig), playerCoins: 40 };
    state = gameReducer(state, {
      type: "BUY_REWARD",
      rewardId: "reward-tea",
      config: validConfig,
    });
    state = gameReducer(state, {
      type: "SELL_REWARD",
      rewardId: "reward-tea",
      config: validConfig,
    });
    expect(state.playerCoins).toBe(20);
    expect(state.ownedRewardIds).not.toContain("reward-tea");
    expect(state.soldRewardIds).toContain("reward-tea");
    expect(state.wheelRewardIds).not.toContain("reward-tea");
  });

  it("unsellable rewards cannot be sold", () => {
    const config: GameConfig = {
      ...validConfig,
      rewards: validConfig.rewards.map((reward) =>
        reward.id === "reward-tea"
          ? { ...reward, type: "UNSELLABLE" as const }
          : reward,
      ),
    };
    const reward = config.rewards[0];
    const state = {
      ...initializeGameState(config),
      ownedRewardIds: ["reward-tea"],
    };

    expect(canSellReward(state, reward)).toBe(false);
    const nextState = gameReducer(state, {
      type: "SELL_REWARD",
      rewardId: "reward-tea",
      config,
    });

    expect(nextState.ownedRewardIds).toContain("reward-tea");
    expect(nextState.soldRewardIds).not.toContain("reward-tea");
  });

  it("deleting a reward removes it from all runtime reward lists", () => {
    const state = {
      ...initializeGameState(validConfig),
      ownedRewardIds: ["reward-tea"],
      soldRewardIds: ["reward-tea"],
      spentWheelRewardIds: ["reward-tea"],
      selectedSpinRewardId: "reward-tea",
    };

    const nextState = gameReducer(state, {
      type: "DELETE_REWARD",
      rewardId: "reward-tea",
      config: validConfig,
    });

    expect(nextState.ownedRewardIds).not.toContain("reward-tea");
    expect(nextState.soldRewardIds).not.toContain("reward-tea");
    expect(nextState.wheelRewardIds).not.toContain("reward-tea");
    expect(nextState.shopRewardIds).not.toContain("reward-tea");
    expect(nextState.spentWheelRewardIds).not.toContain("reward-tea");
    expect(nextState.selectedSpinRewardId).toBeNull();
  });

  it("double balance applies after normal question coins", () => {
    const config = configWithPowerUp(
      "question-history-20",
      "DOUBLE_BALANCE_ON_CORRECT",
    );
    const state = answerQuestion({
      config,
      questionId: "question-history-20",
      result: "CORRECT",
      playerCoins: 10,
    });
    expect(state.playerCoins).toBe(60);
  });

  it("halve balance applies on incorrect and rounds up", () => {
    const config = configWithPowerUp(
      "question-history-20",
      "HALVE_BALANCE_ON_INCORRECT",
    );
    const state = answerQuestion({
      config,
      questionId: "question-history-20",
      result: "INCORRECT",
      playerCoins: 21,
    });
    expect(state.playerCoins).toBe(11);
  });

  it("bonus 10 applies only on correct answers", () => {
    const config = configWithPowerUp(
      "question-history-20",
      "BONUS_ON_CORRECT",
    );
    const correctState = answerQuestion({
      config,
      questionId: "question-history-20",
      result: "CORRECT",
      playerCoins: 5,
    });
    expect(correctState.playerCoins).toBe(45);

    const incorrectState = answerQuestion({
      config,
      questionId: "question-history-20",
      result: "INCORRECT",
      playerCoins: 5,
    });
    expect(incorrectState.playerCoins).toBe(5);
  });

  it("third consecutive correct answer gets a scaling streak bonus and keeps streak bonus active", () => {
    const state = answerQuestion({
      config: validConfig,
      questionId: "question-history-20",
      result: "CORRECT",
      correctStreakCount: 2,
    });
    expect(state.playerCoins).toBe(25);
    expect(state.correctStreakCount).toBe(3);
    expect(state.isStreakBonusActive).toBe(true);
  });

  it("incorrect answer resets streak and disables streak bonus", () => {
    const state = answerQuestion({
      config: validConfig,
      questionId: "question-history-20",
      result: "INCORRECT",
      correctStreakCount: 4,
      isStreakBonusActive: true,
    });
    expect(state.correctStreakCount).toBe(0);
    expect(state.isStreakBonusActive).toBe(false);
  });

  it("incorrect spin-cost power-up doubles the next spin cost and is consumed by spinning", () => {
    const config = configWithPowerUp(
      "question-history-20",
      "DOUBLE_SPIN_COST_ON_INCORRECT",
    );
    let state = answerQuestion({
      config,
      questionId: "question-history-20",
      result: "INCORRECT",
      playerCoins: 60,
    });
    expect(state.nextSpinCost).toBe(40);
    state = gameReducer(state, {
      type: "START_SPIN",
      segmentId: "reward:reward-tea",
      rewardId: "reward-tea",
      spinSnapshotSegmentIds: state.wheelRewardIds.map((id) => `reward:${id}`),
      targetRotationDeg: 100,
      config,
    });
    expect(state.playerCoins).toBe(20);
    expect(state.nextSpinCost).toBe(20);
  });

  it("correct spin-cost power-up halves the next spin cost", () => {
    const config = configWithPowerUp(
      "question-history-20",
      "HALVE_SPIN_COST_ON_CORRECT",
    );
    const state = answerQuestion({
      config,
      questionId: "question-history-20",
      result: "CORRECT",
    });
    expect(state.nextSpinCost).toBe(10);
  });

  it("new game resets power-up runtime state", () => {
    const state = gameReducer(
      {
        ...initializeGameState(validConfig),
        correctStreakCount: 3,
        isStreakBonusActive: true,
        nextSpinCost: 40,
      },
      { type: "START_NEW_GAME", config: validConfig },
    );
    expect(state.correctStreakCount).toBe(0);
    expect(state.isStreakBonusActive).toBe(false);
    expect(state.nextSpinCost).toBe(20);
  });

  it("wheel with no available (unspent) rewards causes immediate game over", () => {
    const state = {
      ...initializeGameState(validConfig),
      wheelRewardIds: ["reward-tea"],
      shopRewardIds: [],
      spentWheelRewardIds: ["reward-tea"],
    };
    expect(isGameOver(validConfig, state)).toBe(true);
  });

  it("no meaningful actions causes game over, owned rewards prevent it until sold", () => {
    let state = {
      ...initializeGameState(validConfig),
      questionStates: {
        "question-history-20": "CORRECT" as const,
        "question-food-5": "INCORRECT" as const,
      },
      playerCoins: 0,
      ownedRewardIds: ["reward-tea"],
      wheelRewardIds: ["reward-toast"],
      shopRewardIds: ["reward-toast"],
      spentWheelRewardIds: ["reward-tea"],
    };
    expect(isGameOver(validConfig, state)).toBe(false);
    state = {
      ...state,
      ownedRewardIds: [],
      soldRewardIds: ["reward-tea"],
      spentWheelRewardIds: ["reward-tea"],
    };
    expect(isGameOver(validConfig, state)).toBe(true);
  });
});
