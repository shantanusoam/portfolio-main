import { NextResponse } from "next/server";
import { listLearningTracks } from "@/lib/learning/store";
import { learningApiError } from "@/lib/learning/responses";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tracks = await listLearningTracks();
    return NextResponse.json(
      { tracks },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return learningApiError(error);
  }
}
