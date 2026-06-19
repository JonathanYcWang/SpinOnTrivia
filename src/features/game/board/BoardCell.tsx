import { CoinDisplay } from "@/components/ui/CoinDisplay";
import type { QuestionCoinValue } from "@/features/config/configTypes";
import type { QuestionRuntimeState } from "../gameTypes";

const boardCellClass = "grid h-16 w-full place-items-center rounded-xl";

export function BoardCell({
  state,
  value,
  topicName,
  isEditMode,
  onOpen,
}: {
  state: QuestionRuntimeState;
  value: QuestionCoinValue;
  topicName: string;
  isEditMode: boolean;
  onOpen(): void;
}) {
  if (state === "UNAVAILABLE") {
    return (
      <div
        aria-label={`No question available for ${topicName} ${value} coins`}
        className={`${boardCellClass} border border-dashed border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-soft)]`}
      >
        -
      </div>
    );
  }
  if (state === "CORRECT" || state === "INCORRECT") {
    const label =
      state === "CORRECT"
        ? "Correct answer completed"
        : "Incorrect answer completed";
    if (isEditMode) {
      return (
        <button
          aria-label={`Edit ${topicName} ${value} coins`}
          className={`${boardCellClass} border border-[var(--border)] bg-[var(--secondary)] text-2xl font-bold transition hover:bg-[var(--secondary)]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]`}
          onClick={onOpen}
          type="button"
        >
          {state === "CORRECT" ? "✓" : "✕"}
        </button>
      );
    }
    return (
      <div
        aria-label={label}
        className={`${boardCellClass} border border-[var(--border)] bg-[var(--secondary)] text-2xl font-bold`}
      >
        {state === "CORRECT" ? "✓" : "✕"}
      </div>
    );
  }
  return (
    <button
      className={`${boardCellClass} border border-[var(--primary)] bg-[var(--primary)]/15 text-lg font-bold transition hover:bg-[var(--primary)]/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]`}
      onClick={onOpen}
      type="button"
      aria-label={`${value} coins`}
    >
      <CoinDisplay value={value} />
    </button>
  );
}
