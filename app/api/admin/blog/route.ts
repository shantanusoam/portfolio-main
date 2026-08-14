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
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const {
    slug,
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

  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
    return NextResponse.json(
      { error: "Slug must be lowercase letters, numbers, and hyphens only" },
      { status: 400 },
    );
  }
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
    parsedSections = typeof sections === "string" ? JSON.parse(sections) : sections;
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
    .select({ slug: contentEntries.slug })
    .from(contentEntries)
    .where(eq(contentEntries.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: `A post with slug "${slug}" already exists` },
      { status: 409 },
    );
  }

  await db.insert(contentEntries).values({
    kind: "blog",
    slug,
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
    revisions: [{ date: publishedAt, note: "Initial publication." }],
    externalUrl: externalUrl?.trim() || null,
  });

  return NextResponse.json({ ok: true, slug }, { status: 201 });
}
