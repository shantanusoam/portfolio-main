import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { contentEntries } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import type { ArticleCategory, ArticleFormat } from "@/lib/archive/types";

const CATEGORIES: ArticleCategory[] = [
  "Engineering",
  "AI Agents",
  "Interfaces",
  "Experiments",
  "Lessons",
];
const FORMATS: ArticleFormat[] = [
  "Essay",
  "Build Log",
  "Tutorial",
  "Field Note",
];

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    title,
    dek,
    category,
    format,
    readingMinutes,
    publishedAt,
    featured,
    accent,
    sections,
    externalUrl,
  } = body;

  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }
  if (typeof dek !== "string" || dek.trim().length === 0) {
    return NextResponse.json({ error: "Dek is required" }, { status: 400 });
  }
  if (!CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  }
  if (!FORMATS.includes(format)) {
    return NextResponse.json({ error: "Invalid format" }, { status: 400 });
  }
  const minutes = Number(readingMinutes);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    return NextResponse.json(
      { error: "Reading minutes must be a positive number" },
      { status: 400 },
    );
  }
  if (typeof publishedAt !== "string" || !publishedAt) {
    return NextResponse.json(
      { error: "Published date is required" },
      { status: 400 },
    );
  }
  if (typeof accent !== "string" || accent.trim().length === 0) {
    return NextResponse.json({ error: "Accent is required" }, { status: 400 });
  }

  let parsedSections;
  try {
    parsedSections = JSON.parse(sections);
  } catch {
    return NextResponse.json(
      { error: "Sections must be valid JSON" },
      { status: 400 },
    );
  }
  if (!Array.isArray(parsedSections)) {
    return NextResponse.json(
      { error: "Sections must be a JSON array" },
      { status: 400 },
    );
  }
  if (
    externalUrl !== undefined &&
    externalUrl !== null &&
    typeof externalUrl !== "string"
  ) {
    return NextResponse.json(
      { error: "External URL must be a string" },
      { status: 400 },
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }

  const existing = await db
    .select({ revisions: contentEntries.revisions })
    .from(contentEntries)
    .where(eq(contentEntries.slug, params.slug))
    .limit(1);

  if (existing.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const previousRevisions = Array.isArray(existing[0].revisions)
    ? existing[0].revisions
    : [];

  await db
    .update(contentEntries)
    .set({
      title,
      dek,
      category,
      format,
      readingMinutes: minutes,
      publishedAt,
      updatedAt: todayString(),
      featured: Boolean(featured),
      accent,
      sections: parsedSections,
      externalUrl: externalUrl?.trim() || null,
      revisions: [
        ...previousRevisions,
        { date: todayString(), note: "Updated via admin." },
      ],
      syncedAt: new Date(),
    })
    .where(eq(contentEntries.slug, params.slug));

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Database unavailable" },
      { status: 503 },
    );
  }

  const result = await db
    .delete(contentEntries)
    .where(eq(contentEntries.slug, params.slug))
    .returning({ slug: contentEntries.slug });

  if (result.length === 0) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
