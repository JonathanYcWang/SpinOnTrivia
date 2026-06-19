import type { RewardConfig } from "@/features/config/configTypes";

export const rewardTiers = [
  { id: "40-50", label: "Bronze", min: 40, max: 40 },
  { id: "50-60", label: "Silver", min: 50, max: 60 },
  { id: "70-80", label: "Gold", min: 70, max: 80 },
  { id: "90-100", label: "Platinum", min: 90, max: 100 },
] as const;

export type RewardTierLabel = (typeof rewardTiers)[number]["label"];

export function getRewardTier(reward: RewardConfig) {
  return rewardTiers.find(
    (tier) => reward.coinValue >= tier.min && reward.coinValue <= tier.max,
  );
}

export function getRewardTierGroups(rewards: RewardConfig[]) {
  return rewardTiers
    .map((tier) => ({
      ...tier,
      rewards: rewards.filter(
        (reward) =>
          reward.coinValue >= tier.min && reward.coinValue <= tier.max,
      ),
    }))
    .filter((tier) => tier.rewards.length > 0);
}
