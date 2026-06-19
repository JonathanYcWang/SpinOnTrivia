import type { GameConfig, RewardConfig } from "@/features/config/configTypes";
import { getRewardTier, rewardTiers } from "@/features/game/shop/rewardTiers";
import type { GameState } from "../gameTypes";
import { getRewardById, getWheelRewards } from "../gameSelectors";

export const EMPTY_WHEEL_SEGMENT_PREFIX = "empty:";
export const REWARD_WHEEL_SEGMENT_PREFIX = "reward:";

export type WheelRewardSegment = {
  type: "REWARD";
  id: string;
  reward: RewardConfig;
};

export type WheelEmptySegment = {
  type: "EMPTY";
  id: string;
};

export type WheelSegment = WheelRewardSegment | WheelEmptySegment;

function getRewardSegmentId(rewardId: string) {
  return `${REWARD_WHEEL_SEGMENT_PREFIX}${rewardId}`;
}

function spreadRewardSegmentsByTier(
  rewardSegments: WheelRewardSegment[],
): WheelRewardSegment[] {
  const tieredRewardSegments = new Map(
    rewardTiers.map((tier) => [tier.label, [] as WheelRewardSegment[]]),
  );
  const untieredRewardSegments: WheelRewardSegment[] = [];

  rewardSegments.forEach((rewardSegment) => {
    const tier = getRewardTier(rewardSegment.reward);
    if (!tier) {
      untieredRewardSegments.push(rewardSegment);
      return;
    }
    tieredRewardSegments.get(tier.label)?.push(rewardSegment);
  });

  const spreadSegments: WheelRewardSegment[] = [];
  let remainingTieredCount = rewardSegments.length - untieredRewardSegments.length;
  while (remainingTieredCount > 0) {
    rewardTiers.forEach((tier) => {
      const nextSegment = tieredRewardSegments.get(tier.label)?.shift();
      if (!nextSegment) return;
      spreadSegments.push(nextSegment);
      remainingTieredCount -= 1;
    });
  }

  return [...spreadSegments, ...untieredRewardSegments];
}

function getSpentRewardEmptySegmentId(rewardId: string) {
  return `${EMPTY_WHEEL_SEGMENT_PREFIX}spent:${rewardId}`;
}

function buildWheelSegments({
  orderedRewardSegments,
  spentRewardIds,
}: {
  orderedRewardSegments: WheelRewardSegment[];
  spentRewardIds: string[];
}): WheelSegment[] {
  const spentRewardSet = new Set(spentRewardIds);
  let activeRewardCount = 0;
  let generatedEmptyCount = 0;

  return orderedRewardSegments.flatMap((rewardSegment) => {
    if (spentRewardSet.has(rewardSegment.reward.id)) {
      return [
        {
          type: "EMPTY" as const,
          id: getSpentRewardEmptySegmentId(rewardSegment.reward.id),
        },
      ];
    }

    activeRewardCount += 1;
    const segments: WheelSegment[] = [rewardSegment];
    if (activeRewardCount % 2 === 0) {
      segments.push({
        type: "EMPTY" as const,
        id: getEmptyWheelSegmentId(generatedEmptyCount),
      });
      generatedEmptyCount += 1;
    }
    return segments;
  });
}

export function getEmptyWheelSegmentId(index: number) {
  return `${EMPTY_WHEEL_SEGMENT_PREFIX}${index}`;
}

export function getEmptyWheelSegments(count: number): WheelEmptySegment[] {
  return Array.from({ length: count }, (_, index) => ({
    type: "EMPTY" as const,
    id: getEmptyWheelSegmentId(index),
  }));
}

export function getWheelSegments(
  config: GameConfig,
  state: GameState,
): WheelSegment[] {
  const orderedRewardSegments = spreadRewardSegmentsByTier(
    getWheelRewards(config, state).map((reward) => ({
      type: "REWARD" as const,
      id: getRewardSegmentId(reward.id),
      reward,
    })),
  );
  return buildWheelSegments({
    orderedRewardSegments,
    spentRewardIds: state.spentWheelRewardIds,
  });
}

export function getWheelSegmentsByIds(
  config: GameConfig,
  segmentIds: string[],
): WheelSegment[] {
  return segmentIds
    .map((segmentId) => {
      if (segmentId.startsWith(EMPTY_WHEEL_SEGMENT_PREFIX)) {
        return { type: "EMPTY" as const, id: segmentId };
      }
      if (segmentId.startsWith(REWARD_WHEEL_SEGMENT_PREFIX)) {
        const rewardId = segmentId.slice(REWARD_WHEEL_SEGMENT_PREFIX.length);
        const reward = getRewardById(config, rewardId);
        return reward
          ? { type: "REWARD" as const, id: segmentId, reward }
          : null;
      }
      return null;
    })
    .filter((segment): segment is WheelSegment => Boolean(segment));
}
