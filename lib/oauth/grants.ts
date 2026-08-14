import { and, eq, gt, isNull } from "drizzle-orm";
import { oauthAuthorizationCodes, oauthRefreshTokens } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { ensureControlPlaneSchema } from "@/lib/db/control-plane";
import {
  constantTimeEqual,
  randomToken,
  sha256Base64Url,
  sha256Hex,
} from "@/lib/oauth/crypto";

const AUTHORIZATION_CODE_TTL_MS = 5 * 60 * 1_000;
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

async function readyDb() {
  const ready = await ensureControlPlaneSchema();
  const db = getDb();
  if (!ready || !db) throw new Error("OAuth database is unavailable");
  return db;
}

export async function issueAuthorizationCode(input: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  resource: string;
}) {
  const db = await readyDb();
  const code = randomToken(32);
  await db.insert(oauthAuthorizationCodes).values({
    codeHash: await sha256Hex(code),
    clientId: input.clientId,
    redirectUri: input.redirectUri,
    codeChallenge: input.codeChallenge,
    scopes: input.scopes,
    resource: input.resource,
    expiresAt: new Date(Date.now() + AUTHORIZATION_CODE_TTL_MS),
  });
  return code;
}

export async function redeemAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}) {
  const db = await readyDb();
  const hash = await sha256Hex(input.code);
  const candidate = await db
    .select()
    .from(oauthAuthorizationCodes)
    .where(
      and(
        eq(oauthAuthorizationCodes.codeHash, hash),
        isNull(oauthAuthorizationCodes.usedAt),
        gt(oauthAuthorizationCodes.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (
    !candidate[0] ||
    candidate[0].clientId !== input.clientId ||
    candidate[0].redirectUri !== input.redirectUri ||
    !(await verifyPkce(input.codeVerifier, candidate[0].codeChallenge))
  ) {
    return null;
  }

  const consumed = await db
    .update(oauthAuthorizationCodes)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(oauthAuthorizationCodes.codeHash, hash),
        isNull(oauthAuthorizationCodes.usedAt),
        gt(oauthAuthorizationCodes.expiresAt, new Date()),
      ),
    )
    .returning();
  return consumed[0] ?? null;
}

export async function verifyPkce(codeVerifier: string, codeChallenge: string) {
  if (codeVerifier.length < 43 || codeVerifier.length > 128) return false;
  const computed = await sha256Base64Url(codeVerifier);
  return constantTimeEqual(computed, codeChallenge);
}

export async function issueRefreshToken(input: {
  clientId: string;
  subject: string;
  scopes: string[];
  resource: string;
}) {
  const db = await readyDb();
  const token = randomToken(48);
  const tokenHash = await sha256Hex(token);
  await db.insert(oauthRefreshTokens).values({
    tokenHash,
    clientId: input.clientId,
    subject: input.subject,
    scopes: input.scopes,
    resource: input.resource,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return { token, tokenHash };
}

export async function rotateRefreshToken(token: string, clientId: string) {
  const db = await readyDb();
  const tokenHash = await sha256Hex(token);
  const current = await db
    .select()
    .from(oauthRefreshTokens)
    .where(
      and(
        eq(oauthRefreshTokens.tokenHash, tokenHash),
        eq(oauthRefreshTokens.clientId, clientId),
        isNull(oauthRefreshTokens.revokedAt),
        gt(oauthRefreshTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!current[0]) return null;
  const replacement = randomToken(48);
  const replacementHash = await sha256Hex(replacement);

  return db.transaction(async (tx) => {
    const revoked = await tx
      .update(oauthRefreshTokens)
      .set({ revokedAt: new Date(), replacedByHash: replacementHash })
      .where(
        and(
          eq(oauthRefreshTokens.tokenHash, tokenHash),
          isNull(oauthRefreshTokens.revokedAt),
        ),
      )
      .returning({ tokenHash: oauthRefreshTokens.tokenHash });

    if (!revoked[0]) return null;
    await tx.insert(oauthRefreshTokens).values({
      tokenHash: replacementHash,
      clientId: current[0].clientId,
      subject: current[0].subject,
      scopes: current[0].scopes,
      resource: current[0].resource,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    });
    return { current: current[0], replacement };
  });
}
