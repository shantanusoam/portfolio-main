import { NextResponse } from "next/server";
import { deleteLearningTrack, updateLearningTrack } from "@/lib/learning/store";
import { learningTrackPatchSchema } from "@/lib/learning/validation";
import { learningApiError } from "@/lib/learning/responses";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ trackId: string }> },
) {
  try {
    const { trackId } = await params;
    const patch = learningTrackPatchSchema.parse(await request.json());
    const updated = await updateLearningTrack(trackId, patch);
    if (!updated) {
      return NextResponse.json(
        { error: "Learning track not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, id: updated.id });
  } catch (error) {
    return learningApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ trackId: string }> },
) {
  try {
    const { trackId } = await params;
    const deleted = await deleteLearningTrack(trackId);
    if (!deleted) {
      return NextResponse.json(
        { error: "Learning track not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, id: deleted.id });
  } catch (error) {
    return learningApiError(error);
  }
}
