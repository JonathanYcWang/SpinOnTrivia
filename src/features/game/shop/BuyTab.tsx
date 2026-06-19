import { getShopBuyRewards, canBuyReward } from "../gameSelectors";
import { useGame } from "../GameProvider";
import { RewardCard } from "./RewardCard";
import { getRewardTierGroups } from "./rewardTiers";

export function BuyTab() {
  const { config, state, isEditMode, dispatch } = useGame();
  const rewards = getShopBuyRewards(config, state);
  if (rewards.length === 0)
    return (
      <p className="text-[var(--text-muted)]">No rewards available to buy.</p>
    );
  const tierGroups = getRewardTierGroups(rewards);
  return (
    <div className="space-y-6">
      {tierGroups.map((tier) => (
        <section className="space-y-3" key={tier.id}>
          <h2 className="text-lg font-bold">{tier.label}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tier.rewards.map((reward) => (
              <RewardCard
                disabled={isEditMode || !canBuyReward(state, reward)}
                key={reward.id}
                mode="buy"
                reward={reward}
                value={reward.coinValue}
                onAction={() =>
                  dispatch({ type: "BUY_REWARD", rewardId: reward.id, config })
                }
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
