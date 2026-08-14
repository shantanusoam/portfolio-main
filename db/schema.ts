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
import type { LearningLink, MappingRow } from "@/@types/learning.type";

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

export const learningTracks = pgTable(
  "learning_tracks",
  {
    id: text("id").primaryKey(),
    checkpoint: text("checkpoint").notNull(),
    status: text("status").notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    tags: jsonb("tags").$type<string[]>().notNull(),
    logTags: jsonb("log_tags").$type<Record<string, string>>().notNull(),
    links: jsonb("links").$type<LearningLink[]>().notNull(),
    mapping: jsonb("mapping").$type<MappingRow[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    statusCheckpointIdx: index("learning_tracks_status_checkpoint_idx").on(
      table.status,
      table.checkpoint,
    ),
  }),
);

export const learningEntries = pgTable(
  "learning_entries",
  {
    id: serial("id").primaryKey(),
    trackId: text("track_id")
      .notNull()
      .references(() => learningTracks.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
    text: text("text").notNull(),
    seed: boolean("seed").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    trackCreatedIdx: index("learning_entries_track_created_idx").on(
      table.trackId,
      table.createdAt,
    ),
  }),
);

export const oauthClients = pgTable("oauth_clients", {
  clientId: text("client_id").primaryKey(),
  clientSecretHash: text("client_secret_hash"),
  name: text("name").notNull(),
  redirectUris: jsonb("redirect_uris").$type<string[]>().notNull(),
  grantTypes: jsonb("grant_types").$type<string[]>().notNull(),
  tokenEndpointAuthMethod: text("token_endpoint_auth_method").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow()
    .notNull(),
});

export const oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    codeHash: text("code_hash").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.clientId, { onDelete: "cascade" }),
    redirectUri: text("redirect_uri").notNull(),
    codeChallenge: text("code_challenge").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    resource: text("resource").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    clientExpiryIdx: index("oauth_authorization_codes_client_expiry_idx").on(
      table.clientId,
      table.expiresAt,
    ),
  }),
);

export const oauthRefreshTokens = pgTable(
  "oauth_refresh_tokens",
  {
    tokenHash: text("token_hash").primaryKey(),
    clientId: text("client_id")
      .notNull()
      .references(() => oauthClients.clientId, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    scopes: jsonb("scopes").$type<string[]>().notNull(),
    resource: text("resource").notNull(),
    expiresAt: timestamp("expires_at", {
      withTimezone: true,
      mode: "date",
    }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true, mode: "date" }),
    replacedByHash: text("replaced_by_hash"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    clientExpiryIdx: index("oauth_refresh_tokens_client_expiry_idx").on(
      table.clientId,
      table.expiresAt,
    ),
  }),
);
