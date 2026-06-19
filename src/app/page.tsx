import { GamePageClient } from "@/features/game/GamePageClient";
import { readEditableGameData } from "@/features/config/gameDataRepository";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ isEditMode?: string | string[] }>;
}) {
  const params = await searchParams;
  const isEditModeParam = Array.isArray(params.isEditMode)
    ? params.isEditMode[0]
    : params.isEditMode;
  const gameDataResult = await readEditableGameData();
  return (
    <GamePageClient
      initialEditMode={isEditModeParam === "true"}
      initialGameDataResult={gameDataResult}
    />
  );
}
