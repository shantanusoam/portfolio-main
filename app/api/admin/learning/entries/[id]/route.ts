import { NextResponse } from "next/server";
import { deleteLearningEntry } from "@/lib/learning/store";
import { learningApiError } from "@/lib/learning/responses";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json(
      { error: "Invalid learning entry id" },
      { status: 400 },
    );
  }

  try {
    const deleted = await deleteLearningEntry(id);
    if (!deleted) {
      return NextResponse.json(
        { error: "Learning entry not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error) {
    return learningApiError(error);
  }
}
