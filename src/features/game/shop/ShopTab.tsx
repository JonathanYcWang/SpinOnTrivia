import { CoinDisplay } from "@/components/ui/CoinDisplay";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import type {
  RewardConfig,
  RewardCoinValue,
} from "@/features/config/configTypes";
import { sortRewards } from "@/lib/sorting";
import { useState } from "react";
import { useGame } from "../GameProvider";
import { BuyTab } from "./BuyTab";
import { SellTab } from "./SellTab";
import { getRewardTierGroups } from "./rewardTiers";

export function ShopTab() {
  const { config, state, isEditMode, dispatch } = useGame();
  return (
    <section className="space-y-5">
      <div className="text-2xl font-bold"><CoinDisplay value={state.playerCoins} /></div>
      {isEditMode ? (
        <RewardEditList rewards={config.rewards} />
      ) : (
        <>
          <Tabs
            ariaLabel="Shop tabs"
            tabs={[
              { value: "BUY", label: "Buy" },
              { value: "SELL", label: "Sell" },
            ]}
            value={state.activeShopTab}
            onChange={(tab) => dispatch({ type: "SET_ACTIVE_SHOP_TAB", tab })}
          />
          {state.activeShopTab === "BUY" ? <BuyTab /> : <SellTab />}
        </>
      )}
    </section>
  );
}

function RewardEditList({ rewards }: { rewards: RewardConfig[] }) {
  const { config, addReward, saveRewardEdits } = useGame();
  const sortedRewards = [...rewards].sort(sortRewards);
  const tierGroups = getRewardTierGroups(sortedRewards);
  const [drafts, setDrafts] = useState(() => createRewardDrafts(rewards));
  const [errors, setErrors] = useState<Record<string, RewardDraftError>>({});

  function cancel() {
    setDrafts(createRewardDrafts(rewards));
    setErrors({});
  }

  function addDraftReward() {
    const reward = addReward();
    if (!reward) return;
    setDrafts((current) => ({
      ...current,
      [reward.id]: createRewardDraft(reward),
    }));
  }

  function save() {
    const nextErrors: Record<string, RewardDraftError> = {};
    sortedRewards.forEach((reward) => {
      const draft = drafts[reward.id] ?? createRewardDraft(reward);
      const name = draft.name.trim();
      const value = Number(draft.value);
      const valueIsAllowed = config.rewardValueOptions.includes(
        value as RewardCoinValue,
      );
      nextErrors[reward.id] = {
        name: name ? "" : "Reward name is required.",
        value: valueIsAllowed ? "" : "Reward value is required.",
      };
    });
    setErrors(nextErrors);
    if (
      Object.values(nextErrors).some((error) => error.name || error.value)
    ) {
      return;
    }
    saveRewardEdits(sortedRewards.map((reward) => {
      const draft = drafts[reward.id] ?? createRewardDraft(reward);
      return {
        rewardId: reward.id,
        name: draft.name.trim(),
        value: Number(draft.value) as RewardCoinValue,
      };
    }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-3">
        <Button onClick={cancel}>Cancel</Button>
        <Button onClick={save} variant="primary">
          Save
        </Button>
        <Button aria-label="Add reward" onClick={addDraftReward} variant="primary">
          +
        </Button>
      </div>
      <div className="space-y-6">
        {tierGroups.map((tier) => (
          <section className="space-y-3" key={tier.id}>
            <h2 className="text-lg font-bold">{tier.label}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tier.rewards.map((reward) => (
                <RewardEditCard
                  draft={drafts[reward.id] ?? createRewardDraft(reward)}
                  errors={errors[reward.id] ?? EMPTY_REWARD_DRAFT_ERROR}
                  key={reward.id}
                  onChange={(draft) =>
                    setDrafts((current) => ({ ...current, [reward.id]: draft }))
                  }
                  reward={reward}
                  rewardValueOptions={config.rewardValueOptions}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

type RewardDraft = {
  name: string;
  value: string;
};

type RewardDraftError = {
  name: string;
  value: string;
};

const EMPTY_REWARD_DRAFT_ERROR = { name: "", value: "" };

function createRewardDraft(reward: RewardConfig): RewardDraft {
  return {
    name: reward.name,
    value: String(reward.coinValue),
  };
}

function createRewardDrafts(rewards: RewardConfig[]) {
  return Object.fromEntries(
    rewards.map((reward) => [reward.id, createRewardDraft(reward)]),
  );
}

function RewardEditCard({
  reward,
  draft,
  errors,
  onChange,
  rewardValueOptions,
}: {
  reward: RewardConfig;
  draft: RewardDraft;
  errors: RewardDraftError;
  onChange(draft: RewardDraft): void;
  rewardValueOptions: RewardCoinValue[];
}) {
  return (
    <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
      <Field error={errors.name} id={`reward-name-${reward.id}`} label="Reward name">
        <Input
          id={`reward-name-${reward.id}`}
          value={draft.name}
          onChange={(event) =>
            onChange({ ...draft, name: event.target.value })
          }
        />
      </Field>
      <Field error={errors.value} id={`reward-value-${reward.id}`} label="Reward value">
        <Select
          id={`reward-value-${reward.id}`}
          value={draft.value}
          onChange={(event) =>
            onChange({ ...draft, value: event.target.value })
          }
        >
          {rewardValueOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
