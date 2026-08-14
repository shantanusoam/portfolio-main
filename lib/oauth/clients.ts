import { eq, sql } from "drizzle-orm";
import { oauthClients } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { ensureControlPlaneSchema } from "@/lib/db/control-plane";
import { constantTimeEqual, randomToken, sha256Hex } from "@/lib/oauth/crypto";

export type OAuthClient = typeof oauthClients.$inferSelect;
export type TokenEndpointAuthMethod =
  "none" | "client_secret_basic" | "client_secret_post";

function redirectUrisFromEnv(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((uri) => uri.trim())
    .filter(Boolean);
}

async function readyDb() {
  const ready = await ensureControlPlaneSchema();
  const db = getDb();
  if (!ready || !db) throw new Error("OAuth database is unavailable");
  return db;
}

async function configuredClients() {
  const clients: Array<typeof oauthClients.$inferInsert> = [];

  if (process.env.OAUTH_CLAUDE_CLIENT_ID) {
    const secret = process.env.OAUTH_CLAUDE_CLIENT_SECRET;
    clients.push({
      clientId: process.env.OAUTH_CLAUDE_CLIENT_ID,
      clientSecretHash: secret ? await sha256Hex(secret) : null,
      name: "Claude portfolio connector",
      redirectUris: redirectUrisFromEnv(process.env.OAUTH_CLAUDE_REDIRECT_URIS),
      grantTypes: ["authorization_code", "refresh_token"],
      tokenEndpointAuthMethod: secret ? "client_secret_basic" : "none",
    });
  }

  if (
    process.env.MCP_HERMES_CLIENT_ID &&
    process.env.MCP_HERMES_CLIENT_SECRET
  ) {
    clients.push({
      clientId: process.env.MCP_HERMES_CLIENT_ID,
      clientSecretHash: await sha256Hex(process.env.MCP_HERMES_CLIENT_SECRET),
      name: "Hermes automation",
      redirectUris: [],
      grantTypes: ["client_credentials"],
      tokenEndpointAuthMethod: "client_secret_basic",
    });
  }

  return clients;
}

export async function syncConfiguredOAuthClients() {
  const db = await readyDb();
  for (const client of await configuredClients()) {
    await db
      .insert(oauthClients)
      .values(client)
      .onConflictDoUpdate({
        target: oauthClients.clientId,
        set: {
          clientSecretHash: client.clientSecretHash,
          name: client.name,
          redirectUris: client.redirectUris,
          grantTypes: client.grantTypes,
          tokenEndpointAuthMethod: client.tokenEndpointAuthMethod,
          updatedAt: new Date(),
        },
      });
  }
}

export async function getOAuthClient(clientId: string) {
  await syncConfiguredOAuthClients();
  const db = await readyDb();
  const result = await db
    .select()
    .from(oauthClients)
    .where(eq(oauthClients.clientId, clientId))
    .limit(1);
  return result[0] ?? null;
}

export function isSafeRedirectUri(value: string) {
  try {
    const url = new URL(value);
    if (url.hash || url.username || url.password) return false;
    if (url.protocol === "https:") return true;
    if (url.protocol === "http:") {
      return ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    }
    return !["javascript:", "data:", "file:"].includes(url.protocol);
  } catch {
    return false;
  }
}

export function clientAllowsRedirect(client: OAuthClient, redirectUri: string) {
  return (
    client.redirectUris.includes(redirectUri) && isSafeRedirectUri(redirectUri)
  );
}

export async function authenticateOAuthClient(
  client: OAuthClient,
  suppliedSecret: string | null,
) {
  if (client.tokenEndpointAuthMethod === "none") return !suppliedSecret;
  if (!client.clientSecretHash || !suppliedSecret) return false;
  const suppliedHash = await sha256Hex(suppliedSecret);
  return constantTimeEqual(client.clientSecretHash, suppliedHash);
}

export async function registerOAuthClient(input: {
  name: string;
  redirectUris: string[];
  grantTypes: string[];
  tokenEndpointAuthMethod: TokenEndpointAuthMethod;
}) {
  const db = await readyDb();
  const count = await db
    .select({ value: sql<number>`count(*)` })
    .from(oauthClients);
  if (Number(count[0]?.value ?? 0) >= 100) {
    throw new Error("OAuth client registration limit reached");
  }

  const clientId = `portfolio_${randomToken(18)}`;
  const clientSecret =
    input.tokenEndpointAuthMethod === "none" ? null : randomToken(32);
  await db.insert(oauthClients).values({
    clientId,
    clientSecretHash: clientSecret ? await sha256Hex(clientSecret) : null,
    name: input.name,
    redirectUris: input.redirectUris,
    grantTypes: input.grantTypes,
    tokenEndpointAuthMethod: input.tokenEndpointAuthMethod,
  });

  return { clientId, clientSecret };
}
