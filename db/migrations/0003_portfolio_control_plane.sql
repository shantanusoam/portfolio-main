CREATE TABLE IF NOT EXISTS "learning_tracks" (
  "id" text PRIMARY KEY NOT NULL,
  "checkpoint" text NOT NULL,
  "status" text NOT NULL,
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "description" text NOT NULL,
  "tags" jsonb NOT NULL,
  "log_tags" jsonb NOT NULL,
  "links" jsonb NOT NULL,
  "mapping" jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "learning_tracks_status_checkpoint_idx"
  ON "learning_tracks" ("status", "checkpoint");

CREATE TABLE IF NOT EXISTS "learning_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "track_id" text NOT NULL REFERENCES "learning_tracks"("id") ON DELETE CASCADE,
  "tag" text NOT NULL,
  "text" text NOT NULL,
  "seed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "learning_entries_track_created_idx"
  ON "learning_entries" ("track_id", "created_at");

CREATE TABLE IF NOT EXISTS "oauth_clients" (
  "client_id" text PRIMARY KEY NOT NULL,
  "client_secret_hash" text,
  "name" text NOT NULL,
  "redirect_uris" jsonb NOT NULL,
  "grant_types" jsonb NOT NULL,
  "token_endpoint_auth_method" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "oauth_authorization_codes" (
  "code_hash" text PRIMARY KEY NOT NULL,
  "client_id" text NOT NULL REFERENCES "oauth_clients"("client_id") ON DELETE CASCADE,
  "redirect_uri" text NOT NULL,
  "code_challenge" text NOT NULL,
  "scopes" jsonb NOT NULL,
  "resource" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "oauth_authorization_codes_client_expiry_idx"
  ON "oauth_authorization_codes" ("client_id", "expires_at");

CREATE TABLE IF NOT EXISTS "oauth_refresh_tokens" (
  "token_hash" text PRIMARY KEY NOT NULL,
  "client_id" text NOT NULL REFERENCES "oauth_clients"("client_id") ON DELETE CASCADE,
  "subject" text NOT NULL,
  "scopes" jsonb NOT NULL,
  "resource" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "revoked_at" timestamp with time zone,
  "replaced_by_hash" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "oauth_refresh_tokens_client_expiry_idx"
  ON "oauth_refresh_tokens" ("client_id", "expires_at");
