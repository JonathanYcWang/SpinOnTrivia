import {
  readEditableGameData,
  writeEditableGameData,
} from "@/features/config/gameDataRepository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await readEditableGameData();
    if (!result.valid) {
      return Response.json(
        { status: "invalid", fieldErrors: result.fieldErrors },
        { status: 422 },
      );
    }
    return Response.json({ status: "ok", data: result.data });
  } catch {
    return Response.json(
      { status: "error", message: "Unable to read game data." },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const result = await writeEditableGameData(data);
    if (!result.valid) {
      return Response.json(
        { status: "invalid", fieldErrors: result.fieldErrors },
        { status: 422 },
      );
    }
    return Response.json({ status: "ok", data: result.data });
  } catch {
    return Response.json(
      { status: "error", message: "Unable to save game data." },
      { status: 500 },
    );
  }
}
