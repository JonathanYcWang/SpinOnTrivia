import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CoinDisplay } from "@/components/ui/CoinDisplay";
import type { RewardConfig } from "@/features/config/configTypes";
import { getSellValue } from "../gameSelectors";

export function SellRewardDialog({
  reward,
  onCancel,
  onConfirm,
}: {
  reward: RewardConfig;
  onCancel(): void;
  onConfirm(): void;
}) {
  return (
    <ConfirmDialog
      danger
      title={<>Sell {reward.name} for <CoinDisplay value={getSellValue(reward)} />?</>}
      body="This reward will be permanently removed and cannot be reclaimed."
      cancelLabel="Cancel"
      confirmLabel="Sell"
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
