import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { ArchiveArticle } from "@/lib/archive/types";

export const contentEntries = pgTable(
  "content_entries",
  {
    id: serial("id").primaryKey(),
    kind: text("kind").notNull().default("blog"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    dek: text("dek").notNull(),
    category: text("category").notNull(),
    format: text("format").notNull(),
    readingMinutes: integer("reading_minutes").notNull(),
    publishedAt: date("published_at", { mode: "string" }).notNull(),
    updatedAt: date("updated_at", { mode: "string" }).notNull(),
    featured: boolean("featured").notNull().default(false),
    accent: text("accent").notNull(),
    externalUrl: text("external_url"),
    sections: jsonb("sections").$type<ArchiveArticle["sections"]>().notNull(),
    revisions: jsonb("revisions")
      .$type<ArchiveArticle["revisions"]>()
      .notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    slugUnique: uniqueIndex("content_entries_slug_unique").on(table.slug),
    kindPublishedIdx: index("content_entries_kind_published_idx").on(
      table.kind,
      table.publishedAt,
    ),
  }),
);
