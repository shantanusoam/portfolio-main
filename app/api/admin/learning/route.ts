import { NextResponse } from "next/server";
import { createLearningTrack, listLearningTracks } from "@/lib/learning/store";
import { learningTrackSchema } from "@/lib/learning/validation";
import { learningApiError } from "@/lib/learning/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return NextResponse.json({ tracks: await listLearningTracks() });
  } catch (error) {
    return learningApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const input = learningTrackSchema.parse(await request.json());
    const created = await createLearningTrack(input);
    if (!created) {
      return NextResponse.json(
        { error: `Learning track "${input.id}" already exists` },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (error) {
    return learningApiError(error);
  }
}
