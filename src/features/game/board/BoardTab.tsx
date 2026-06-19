import { CoinDisplay } from "@/components/ui/CoinDisplay";
import { useGame } from "../GameProvider";
import { BoardGrid } from "./BoardGrid";
import { PowerUpConfetti, QuestionModal } from "./QuestionModal";

export function BoardTab() {
  const { state, dispatch } = useGame();
  return (
    <section className="flex min-h-[calc(100dvh-10rem)] flex-col">
      <div className="space-y-3">
        <div className="text-2xl font-bold">
          <CoinDisplay value={state.playerCoins} />
        </div>
        {state.isStreakBonusActive ? (
          <div
            className="animate-pulse rounded-lg border border-[var(--primary)] bg-[var(--primary)]/15 px-4 py-3 text-center text-lg font-bold text-[var(--foreground)]"
            role="status"
          >
            Correct streak: {state.correctStreakCount}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-center py-6">
        <BoardGrid />
      </div>
      <QuestionModal />
      {state.isMysteryGiftDiscovered ? (
        <MysteryGiftDialog
          onClose={() => dispatch({ type: "DISMISS_MYSTERY_GIFT" })}
        />
      ) : null}
    </section>
  );
}

function MysteryGiftDialog({ onClose }: { onClose(): void }) {
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-black/50 px-4 py-8">
      <PowerUpConfetti />
      <div
        aria-modal="true"
        className="relative mx-auto w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-2xl"
        role="dialog"
      >
        <button
          aria-label="Close Mystery Gift"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-[var(--border)] text-lg font-bold text-[var(--foreground)] transition hover:bg-[var(--secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          onClick={onClose}
          type="button"
        >
          X
        </button>
        <h2 className="text-2xl font-bold">Mystery Gift Discovered 🎁</h2>
      </div>
    </div>
  );
}
