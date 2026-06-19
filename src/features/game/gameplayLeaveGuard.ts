import { useEffect } from "react";
import type { GameState } from "./gameTypes";

export function useGameplayLeaveGuard(state: GameState) {
  useEffect(() => {
    if (state.gameStatus !== "ACTIVE") return;
    function onBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "Your current game progress will be lost. Are you sure you want to leave?";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.gameStatus]);
}
