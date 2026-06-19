import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EditableGameData } from "./editableGameData";
import {
  validateEditableGameData,
  type FieldError,
} from "./configValidation";

const GAME_DATA_PATH = path.join(
  process.cwd(),
  "src",
  "features",
  "config",
  "game-data.json",
);

export type GameDataReadResult =
  | { valid: true; data: EditableGameData }
  | { valid: false; fieldErrors: FieldError[] };

export async function readEditableGameData(): Promise<GameDataReadResult> {
  const raw = await readFile(GAME_DATA_PATH, "utf8");
  const parsed = JSON.parse(raw);
  const validation = validateEditableGameData(parsed);
  if (!validation.valid) return validation;
  return { valid: true, data: validation.data as EditableGameData };
}

export async function writeEditableGameData(
  data: unknown,
): Promise<GameDataReadResult> {
  const validation = validateEditableGameData(data);
  if (!validation.valid) return validation;
  await writeFile(GAME_DATA_PATH, `${JSON.stringify(validation.data, null, 2)}\n`);
  return { valid: true, data: validation.data as EditableGameData };
}
