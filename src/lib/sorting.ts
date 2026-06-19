import type { RewardConfig } from "@/features/config/configTypes";

export function sortRewards(a: RewardConfig, b: RewardConfig): number {
  if (a.coinValue !== b.coinValue) return a.coinValue - b.coinValue;
  const nameCompare = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  if (nameCompare !== 0) return nameCompare;
  return a.id.localeCompare(b.id);
}
