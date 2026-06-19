import { describe, expect, it } from "vitest";
import { initializeGameState } from "../gameInitialization";
import { validConfig } from "@/test/fixtures/configs";
import type { GameConfig, RewardConfig } from "@/features/config/configTypes";
import { getWheelSegments } from "./wheelSegments";

describe("wheel segments", () => {
  it("adds one empty segment after every two reward segments", () => {
    const segments = getWheelSegments(validConfig, initializeGameState(validConfig));
    const emptySegments = segments.filter((segment) => segment.type === "EMPTY");

    expect(segments).toHaveLength(3);
    expect(emptySegments).toHaveLength(1);
    expect(segments[0]).toMatchObject({
      type: "REWARD",
      id: "reward:reward-tea",
    });
    expect(segments[1]).toMatchObject({
      type: "REWARD",
      id: "reward:reward-toast",
    });
    expect(segments[2]).toMatchObject({
      type: "EMPTY",
      id: "empty:0",
    });
  });

  it("does not add an empty segment after an unpaired final reward", () => {
    const rewards: RewardConfig[] = [
      { id: "reward-1", name: "Reward 1", description: "", coinValue: 40 },
      { id: "reward-2", name: "Reward 2", description: "", coinValue: 50 },
      { id: "reward-3", name: "Reward 3", description: "", coinValue: 70 },
    ];
    const config: GameConfig = { ...validConfig, rewards };
    const segments = getWheelSegments(config, initializeGameState(config));

    expect(segments.map((segment) => segment.type)).toEqual([
      "REWARD",
      "REWARD",
      "EMPTY",
      "REWARD",
    ]);
  });

  it("turns spent reward segments into empty segments", () => {
    const state = {
      ...initializeGameState(validConfig),
      spentWheelRewardIds: ["reward-tea"],
    };
    const segments = getWheelSegments(validConfig, state);

    expect(segments).toHaveLength(2);
    expect(segments[0]).toMatchObject({
      type: "EMPTY",
      id: "empty:spent:reward-tea",
    });
    expect(segments[1]).toMatchObject({
      type: "REWARD",
      id: "reward:reward-toast",
    });
  });

  it("adds generated empty segments after every two active reward segments", () => {
    const rewards: RewardConfig[] = [
      { id: "reward-1", name: "Reward 1", description: "", coinValue: 40 },
      { id: "reward-2", name: "Reward 2", description: "", coinValue: 50 },
      { id: "reward-3", name: "Reward 3", description: "", coinValue: 70 },
      { id: "reward-4", name: "Reward 4", description: "", coinValue: 90 },
    ];
    const config: GameConfig = { ...validConfig, rewards };
    const state = {
      ...initializeGameState(config),
      spentWheelRewardIds: ["reward-1"],
    };
    const segments = getWheelSegments(config, state);

    expect(segments.map((segment) => segment.type)).toEqual([
      "EMPTY",
      "REWARD",
      "REWARD",
      "EMPTY",
      "REWARD",
    ]);
  });

  it("spreads reward tiers across reward positions before interleaving empty segments", () => {
    const rewards: RewardConfig[] = [
      { id: "bronze-1", name: "Bronze 1", description: "", coinValue: 40 },
      { id: "bronze-2", name: "Bronze 2", description: "", coinValue: 40 },
      { id: "silver-1", name: "Silver 1", description: "", coinValue: 50 },
      { id: "silver-2", name: "Silver 2", description: "", coinValue: 60 },
      { id: "gold-1", name: "Gold 1", description: "", coinValue: 70 },
      { id: "gold-2", name: "Gold 2", description: "", coinValue: 80 },
      { id: "platinum-1", name: "Platinum 1", description: "", coinValue: 90 },
      { id: "platinum-2", name: "Platinum 2", description: "", coinValue: 100 },
    ];
    const config: GameConfig = { ...validConfig, rewards };
    const rewardIds = getWheelSegments(config, initializeGameState(config))
      .filter((segment) => segment.type === "REWARD")
      .map((segment) => segment.reward.id);

    expect(rewardIds).toEqual([
      "bronze-1",
      "silver-1",
      "gold-1",
      "platinum-1",
      "bronze-2",
      "silver-2",
      "gold-2",
      "platinum-2",
    ]);
  });
});
