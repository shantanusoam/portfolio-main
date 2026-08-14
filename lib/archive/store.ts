import { and, desc, eq } from "drizzle-orm";
import { contentEntries } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { archiveArticles } from "./data";
import type { ArchiveArticle } from "./types";

type ContentEntryRow = typeof contentEntries.$inferSelect;

function rowToArticle(row: ContentEntryRow): ArchiveArticle {
  return {
    slug: row.slug,
    title: row.title,
    dek: row.dek,
    category: row.category as ArchiveArticle["category"],
    format: row.format as ArchiveArticle["format"],
    readingMinutes: row.readingMinutes,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
    featured: row.featured,
    accent: row.accent,
    sections: row.sections as ArchiveArticle["sections"],
    revisions: row.revisions as ArchiveArticle["revisions"],
    externalUrl: row.externalUrl ?? undefined,
  };
}

export async function listArchiveArticles(): Promise<ArchiveArticle[]> {
  const db = getDb();
  if (!db) return archiveArticles;

  try {
    const rows = await db
      .select()
      .from(contentEntries)
      .where(eq(contentEntries.kind, "blog"))
      .orderBy(desc(contentEntries.publishedAt));

    return rows.map(rowToArticle);
  } catch {
    return archiveArticles;
  }
}

export async function getArchiveArticle(
  slug: string,
): Promise<ArchiveArticle | undefined> {
  const db = getDb();
  if (!db) return archiveArticles.find((article) => article.slug === slug);

  try {
    const rows = await db
      .select()
      .from(contentEntries)
      .where(
        and(eq(contentEntries.kind, "blog"), eq(contentEntries.slug, slug)),
      )
      .limit(1);

    return rows[0] ? rowToArticle(rows[0]) : undefined;
  } catch {
    return archiveArticles.find((article) => article.slug === slug);
  }
}

export async function upsertArchiveArticles(
  articles: ArchiveArticle[] = archiveArticles,
) {
  const db = getDb();
  if (!db) {
    throw new Error("DATABASE_URL is not set, cannot seed archive content.");
  }

  for (const article of articles) {
    const row = {
      kind: "blog",
      slug: article.slug,
      title: article.title,
      dek: article.dek,
      category: article.category,
      format: article.format,
      readingMinutes: article.readingMinutes,
      publishedAt: article.publishedAt,
      updatedAt: article.updatedAt,
      featured: article.featured ?? false,
      accent: article.accent,
      sections: article.sections,
      revisions: article.revisions,
      externalUrl: article.externalUrl ?? null,
    };

    await db
      .insert(contentEntries)
      .values(row)
      .onConflictDoUpdate({
        target: contentEntries.slug,
        set: {
          ...row,
          syncedAt: new Date(),
        },
      });
  }
}
