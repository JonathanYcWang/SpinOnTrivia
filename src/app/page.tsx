import { GamePageClient } from "@/features/game/GamePageClient";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ isEditMode?: string | string[] }>;
}) {
  const params = await searchParams;
  const isEditModeParam = Array.isArray(params.isEditMode)
    ? params.isEditMode[0]
    : params.isEditMode;
  return <GamePageClient initialEditMode={isEditModeParam === "true"} />;
}
