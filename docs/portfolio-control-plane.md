# Portfolio control plane

The portfolio now has one guarded write boundary for human and agent-driven publishing:

- Public visitors read learning data from `GET /api/learning`.
- The browser admin uses the signed `admin_session` cookie.
- MCP clients use scoped bearer tokens and call `POST /api/mcp`.
- MCP tools call `/api/admin/*`; they never import the database layer.

## Data model

`learning_tracks` stores checkpoint, status, copy, tags, links, and mapping rows. `learning_entries` stores the track id, tag, text, seed flag, and timestamp. This mirrors the existing `LearningTrack` and `LogEntry` shapes without adding nullable learning columns to `content_entries`.

The runtime applies idempotent `CREATE TABLE IF NOT EXISTS` statements on the first control-plane request so a normal Vercel Git deployment can boot safely. Managed environments should still run:

```bash
pnpm db:migrate
```

## MCP tools

Endpoint: `https://YOUR_DOMAIN/api/mcp`

### `create_blog_post`

The schema asks the calling model for the raw thought plus a truthful structured draft. Its descriptions encode the archive's existing voice: first-person, concrete, system boundaries made explicit, no invented measurements, and an arc from contract through mechanics to accessibility and evidence. The server normalizes anchors, reading time, date, slug, and revisions before calling `POST /api/admin/blog`.

### `add_learning_entry`

Takes a topic or track id, tag, and durable field note. It lists tracks through `GET /api/admin/learning`, creates a shaped track when needed, and writes the note through `POST /api/admin/learning/:trackId/entries`.

Both tools require `portfolio:write`.

## Claude / browser OAuth

The server publishes:

- `/.well-known/oauth-protected-resource`
- `/.well-known/oauth-protected-resource/api/mcp`
- `/.well-known/oauth-authorization-server`

Claude can dynamically register a public client, open `/oauth/authorize`, and complete authorization-code + PKCE (`S256`). The portfolio admin login is the single-user identity check. The consent page shows the client and requested scopes. Codes expire after five minutes and are single use. Access tokens expire after one hour; refresh tokens last 30 days and rotate on every use.

If Claude's connector form requires a client id and secret instead of dynamic registration, configure `OAUTH_CLAUDE_CLIENT_ID`, `OAUTH_CLAUDE_CLIENT_SECRET`, and the exact comma-separated `OAUTH_CLAUDE_REDIRECT_URIS` in Vercel, then enter the same id/secret in Claude.

## Hermes / browserless auth

Hermes should use the same authorization server with the `client_credentials` grant. Put `MCP_HERMES_CLIENT_ID` and `MCP_HERMES_CLIENT_SECRET` in Vercel and in Hermes's secret manager. Request and cache a one-hour token:

```bash
curl -u "$MCP_HERMES_CLIENT_ID:$MCP_HERMES_CLIENT_SECRET" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "scope=portfolio:read portfolio:write" \
  -d "resource=https://YOUR_DOMAIN/api/mcp" \
  "https://YOUR_DOMAIN/api/oauth/token"
```

Send `access_token` as `Authorization: Bearer ...` on MCP requests. Re-run the exchange before expiry; no login, redirect, consent, or browser exists in this path.

For a client that cannot perform a token exchange, set one 32-byte-or-longer random `MCP_HERMES_TOKEN` in Vercel and Hermes, then use it directly as the bearer token. This is a compatibility fallback, not a source-code constant.

## Required production configuration

```dotenv
DATABASE_URL=postgresql://...
ADMIN_PASSWORD=...
ADMIN_SESSION_SECRET=...
PORTFOLIO_PUBLIC_URL=https://YOUR_DOMAIN
OAUTH_SIGNING_SECRET=...
MCP_HERMES_CLIENT_ID=hermes-portfolio
MCP_HERMES_CLIENT_SECRET=...
```

Generate independent secrets with `openssl rand -hex 32`. Never prefix secrets with `NEXT_PUBLIC_`, commit them, put them in browser JavaScript, or send database credentials to an MCP client.

## Operational checks

Open `/admin` to see configuration presence (never values), `/admin/learning` to manage shared learning tracks, and `/admin/blog` to manage posts. An unauthenticated `/api/mcp` request should return `401` with a protected-resource metadata link. A bearer token without `portfolio:write` must not reach the admin APIs.
