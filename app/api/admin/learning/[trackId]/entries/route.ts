import { NextResponse } from "next/server";
import { addLearningEntry } from "@/lib/learning/store";
import { learningEntrySchema } from "@/lib/learning/validation";
import { learningApiError } from "@/lib/learning/responses";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ trackId: string }> },
) {
  try {
    const { trackId } = await params;
    const input = learningEntrySchema.parse(await request.json());
    const entry = await addLearningEntry(trackId, input);
    if (!entry) {
      return NextResponse.json(
        { error: "Learning track not found" },
        { status: 404 },
      );
    }
    return NextResponse.json({ ok: true, entry }, { status: 201 });
  } catch (error) {
    return learningApiError(error);
  }
}
