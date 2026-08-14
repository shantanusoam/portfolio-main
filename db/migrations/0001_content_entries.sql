CREATE TABLE IF NOT EXISTS "content_entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text DEFAULT 'blog' NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"dek" text NOT NULL,
	"category" text NOT NULL,
	"format" text NOT NULL,
	"reading_minutes" integer NOT NULL,
	"published_at" date NOT NULL,
	"updated_at" date NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"accent" text NOT NULL,
	"sections" jsonb NOT NULL,
	"revisions" jsonb NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "content_entries_slug_unique" ON "content_entries" USING btree ("slug");
CREATE INDEX IF NOT EXISTS "content_entries_kind_published_idx" ON "content_entries" USING btree ("kind","published_at");
