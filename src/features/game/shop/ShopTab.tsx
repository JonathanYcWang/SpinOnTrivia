import { CoinDisplay } from "@/components/ui/CoinDisplay";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import type {
  RewardConfig,
  RewardCoinValue,
  RewardType,
} from "@/features/config/configTypes";
import { sortRewards } from "@/lib/sorting";
import { useEffect, useState } from "react";
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
  const { config, addReward, saveRewardEdit, deleteReward, dispatch } =
    useGame();
  const [deletedRewardIds, setDeletedRewardIds] = useState<string[]>([]);
  const visibleRewards = rewards.filter(
    (reward) => !deletedRewardIds.includes(reward.id),
  );
  const sortedRewards = [...visibleRewards].sort(sortRewards);
  const tierGroups = getRewardTierGroups(sortedRewards);
  const [drafts, setDrafts] = useState(() => createRewardDrafts(rewards));
  const [errors, setErrors] = useState<Record<string, RewardDraftError>>({});

  function addDraftReward() {
    const reward = addReward();
    if (!reward) return;
    setDrafts((current) => ({
      ...current,
      [reward.id]: createRewardDraft(reward),
    }));
  }

  function saveRewardDraft(rewardId: string, draft: RewardDraft) {
    const name = draft.name.trim();
    const value = Number(draft.value);
    const valueIsAllowed = config.rewardValueOptions.includes(
      value as RewardCoinValue,
    );
    const nextError = {
      name: name ? "" : "Reward name is required.",
      value: valueIsAllowed ? "" : "Reward value is required.",
    };
    setErrors((current) => ({ ...current, [rewardId]: nextError }));
    if (nextError.name || nextError.value) return;
    saveRewardEdit(rewardId, name, value as RewardCoinValue, draft.type);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-end gap-3">
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
                  onSave={(draft) => saveRewardDraft(reward.id, draft)}
                  onDelete={() => {
                    deleteReward(reward.id);
                    setDeletedRewardIds((current) =>
                      current.includes(reward.id)
                        ? current
                        : [...current, reward.id],
                    );
                    dispatch({
                      type: "DELETE_REWARD",
                      rewardId: reward.id,
                      config,
                    });
                    setDrafts((current) => {
                      const nextDrafts = { ...current };
                      delete nextDrafts[reward.id];
                      return nextDrafts;
                    });
                    setErrors((current) => {
                      const nextErrors = { ...current };
                      delete nextErrors[reward.id];
                      return nextErrors;
                    });
                  }}
                  canDelete={visibleRewards.length > 1}
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
  type: RewardType;
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
    type: reward.type,
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
  onSave,
  onDelete,
  canDelete,
  rewardValueOptions,
}: {
  reward: RewardConfig;
  draft: RewardDraft;
  errors: RewardDraftError;
  onChange(draft: RewardDraft): void;
  onSave(draft: RewardDraft): void;
  onDelete(): void;
  canDelete: boolean;
  rewardValueOptions: RewardCoinValue[];
}) {
  useEffect(() => {
    if (draft.name === reward.name) return;
    const timeoutId = window.setTimeout(() => onSave(draft), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [draft, onSave, reward.name]);

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
          onChange={(event) => {
            const nextDraft = { ...draft, value: event.target.value };
            onChange(nextDraft);
            onSave(nextDraft);
          }}
        >
          {rewardValueOptions.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
      </Field>
      <Field id={`reward-type-${reward.id}`} label="Reward type">
        <Select
          id={`reward-type-${reward.id}`}
          value={draft.type}
          onChange={(event) => {
            const nextDraft = {
              ...draft,
              type: event.target.value as RewardType,
            };
            onChange(nextDraft);
            onSave(nextDraft);
          }}
        >
          <option value="SELLABLE">Sellable</option>
          <option value="UNSELLABLE">Cannot be sold</option>
        </Select>
      </Field>
      <div className="flex justify-end">
        <Button
          aria-label={`Delete ${reward.name}`}
          disabled={!canDelete}
          onClick={onDelete}
          variant="danger"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
