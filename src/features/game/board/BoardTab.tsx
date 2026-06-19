import { CoinDisplay } from "@/components/ui/CoinDisplay";
import { useGame } from "../GameProvider";
import { getCorrectStreakBonus } from "../gameRules";
import { BoardGrid } from "./BoardGrid";
import { QuestionModal } from "./QuestionModal";

export function BoardTab() {
  const { state } = useGame();
  const nextCorrectBonus = getCorrectStreakBonus(state.correctStreakCount + 1);
  return (
    <section className="flex min-h-[calc(100dvh-10rem)] flex-col">
      <div className="space-y-3">
        <div className="text-2xl font-bold">
          <CoinDisplay value={state.playerCoins} />
        </div>
        {state.isStreakBonusActive ? (
          <div
            className="rounded-lg border border-[var(--primary)] bg-[var(--primary)]/15 px-4 py-3 text-center text-lg font-bold text-[var(--foreground)]"
            role="status"
          >
            <p>Correct Streak: {state.correctStreakCount}</p>
            <p>Next bonus: +{nextCorrectBonus} coins</p>
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 items-center justify-center py-6">
        <BoardGrid />
      </div>
      <QuestionModal />
    </section>
  );
}
