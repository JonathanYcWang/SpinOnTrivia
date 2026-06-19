import { initializeGameState } from "@/features/game/gameInitialization";
import { validConfig } from "./configs";

export const initialGameState = initializeGameState(validConfig);
