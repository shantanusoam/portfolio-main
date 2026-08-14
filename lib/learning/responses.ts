import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { LearningStoreUnavailableError } from "@/lib/learning/store";

export function learningApiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Invalid learning data",
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (error instanceof LearningStoreUnavailableError) {
    return NextResponse.json({ error: error.message }, { status: 503 });
  }

  console.error("Learning API error", error);
  return NextResponse.json(
    { error: "Learning service failed" },
    { status: 500 },
  );
}
