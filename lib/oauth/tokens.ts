import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import {
  base64UrlDecode,
  base64UrlEncode,
  constantTimeEqual,
  hmacBase64Url,
  randomToken,
} from "@/lib/oauth/crypto";
import {
  getIssuer,
  getMcpResource,
  hasRequiredScopes,
} from "@/lib/oauth/config";

const ACCESS_TOKEN_TTL_SECONDS = 60 * 60;

type AccessTokenPayload = {
  iss: string;
  sub: string;
  aud: string;
  client_id: string;
  scope: string;
  iat: number;
  exp: number;
  jti: string;
};

function signingSecret() {
  return (
    process.env.OAUTH_SIGNING_SECRET || process.env.ADMIN_SESSION_SECRET || null
  );
}

export async function createAccessToken({
  clientId,
  subject,
  scopes,
  resource,
  issuer,
}: {
  clientId: string;
  subject: string;
  scopes: string[];
  resource: string;
  issuer: string;
}) {
  const secret = signingSecret();
  if (!secret) throw new Error("OAuth signing secret is not configured");

  const now = Math.floor(Date.now() / 1000);
  const payload: AccessTokenPayload = {
    iss: issuer,
    sub: subject,
    aud: resource,
    client_id: clientId,
    scope: scopes.join(" "),
    iat: now,
    exp: now + ACCESS_TOKEN_TTL_SECONDS,
    jti: randomToken(16),
  };
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = await hmacBase64Url(secret, unsigned);

  return {
    token: `${unsigned}.${signature}`,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
}

export async function verifyAccessToken(
  token: string | undefined,
  options: {
    request?: Request;
    resource?: string;
    requiredScopes?: string[];
  } = {},
): Promise<AuthInfo | undefined> {
  if (!token) return undefined;

  const resource = options.resource ?? getMcpResource(options.request);
  const staticToken = process.env.MCP_HERMES_TOKEN;
  if (staticToken && constantTimeEqual(token, staticToken)) {
    const scopes = ["portfolio:read", "portfolio:write"];
    if (!hasRequiredScopes(scopes, options.requiredScopes ?? []))
      return undefined;
    return {
      token,
      clientId: process.env.MCP_HERMES_CLIENT_ID || "hermes-static",
      scopes,
      resource: new URL(resource),
      extra: { subject: "hermes", grantType: "static_token" },
    };
  }

  const secret = signingSecret();
  if (!secret) return undefined;
  const parts = token.split(".");
  if (parts.length !== 3) return undefined;

  try {
    const [headerPart, payloadPart, signature] = parts;
    const header = JSON.parse(base64UrlDecode(headerPart)) as {
      alg?: string;
      typ?: string;
    };
    if (header.alg !== "HS256" || header.typ !== "JWT") return undefined;

    const expectedSignature = await hmacBase64Url(
      secret,
      `${headerPart}.${payloadPart}`,
    );
    if (!constantTimeEqual(signature, expectedSignature)) return undefined;

    const payload = JSON.parse(
      base64UrlDecode(payloadPart),
    ) as AccessTokenPayload;
    const now = Math.floor(Date.now() / 1000);
    if (
      payload.iss !== getIssuer(options.request) ||
      payload.aud !== resource ||
      !payload.client_id ||
      !payload.sub ||
      !Number.isFinite(payload.exp) ||
      payload.exp <= now ||
      payload.iat > now + 60
    ) {
      return undefined;
    }

    const scopes = payload.scope.split(/\s+/).filter(Boolean);
    if (!hasRequiredScopes(scopes, options.requiredScopes ?? []))
      return undefined;

    return {
      token,
      clientId: payload.client_id,
      scopes,
      expiresAt: payload.exp,
      resource: new URL(payload.aud),
      extra: { subject: payload.sub, grantType: "oauth" },
    };
  } catch {
    return undefined;
  }
}
