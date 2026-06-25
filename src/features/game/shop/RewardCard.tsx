"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CoinDisplay } from "@/components/ui/CoinDisplay";
import type { RewardConfig } from "@/features/config/configTypes";

export function RewardCard({
  reward,
  mode,
  value,
  disabled,
  onAction,
}: {
  reward: RewardConfig;
  mode: "buy" | "sell";
  value: number;
  disabled: boolean;
  onAction(): void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = reward.description.length > 90;
  const description =
    isLong && !expanded
      ? `${reward.description.slice(0, 90)}...`
      : reward.description;

  return (
    <Card className="space-y-3">
      <div className="min-w-0">
        <h3 className="truncate text-lg font-semibold" title={reward.name}>
          {reward.name}
        </h3>
        {mode === "buy" ? (
          <>
            <CoinDisplay value={value} />
            {reward.type !== "SELLABLE" && (
              <p className="mt-1 text-xs tracking-wide text-[var(--text-muted)]">
                This item cannot be sold back later
              </p>
            )}
          </>
        ) : reward.type === "SELLABLE" ? (
          <p className="mt-1 text-sm font-medium text-[var(--primary)]">
            Sell Value:&ensp;
            <CoinDisplay value={value} />
          </p>
        ) : (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Cannot be sold
          </p>
        )}
      </div>
      {reward.description ? (
        <div className="text-sm leading-6 text-[var(--text-muted)]">
          <p>{description}</p>
          {isLong ? (
            <div className="mt-2 flex justify-end">
              <Button
                className="min-h-0 px-0 py-0 text-[var(--primary)]"
                onClick={() => setExpanded((current) => !current)}
                variant="ghost"
              >
                {expanded ? "Show Less" : "Show More"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
      <div className="flex justify-end">
        <Button
          disabled={disabled}
          onClick={onAction}
          variant={mode === "sell" ? "danger" : "primary"}
        >
          {mode === "sell" ? "Sell" : "Buy"}
        </Button>
      </div>
    </Card>
  );
}
