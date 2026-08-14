import { authenticateOAuthClient, getOAuthClient } from "@/lib/oauth/clients";
import {
  getIssuer,
  getMcpResource,
  parseScopeRequest,
} from "@/lib/oauth/config";
import {
  issueRefreshToken,
  redeemAuthorizationCode,
  rotateRefreshToken,
} from "@/lib/oauth/grants";
import { oauthError, oauthJson, oauthOptions } from "@/lib/oauth/http";
import { createAccessToken } from "@/lib/oauth/tokens";

function parseBasicAuthorization(value: string | null) {
  if (!value?.startsWith("Basic ")) return null;
  try {
    const decoded = atob(value.slice(6));
    const separator = decoded.indexOf(":");
    if (separator < 0) return null;
    return {
      clientId: decodeURIComponent(decoded.slice(0, separator)),
      clientSecret: decodeURIComponent(decoded.slice(separator + 1)),
    };
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  if (!form) return oauthError("invalid_request", "Expected form-encoded data");

  const basic = parseBasicAuthorization(request.headers.get("authorization"));
  const formClientId = String(form.get("client_id") ?? "");
  const formClientSecret = form.get("client_secret");
  if (basic && formClientSecret) {
    return oauthError(
      "invalid_request",
      "Use exactly one client authentication method",
    );
  }

  const clientId = basic?.clientId || formClientId;
  if (!clientId)
    return oauthError("invalid_client", "Client id is required", 401);

  try {
    const client = await getOAuthClient(clientId);
    if (!client) return oauthError("invalid_client", "Unknown client", 401);

    const methodUsed = basic
      ? "client_secret_basic"
      : formClientSecret
        ? "client_secret_post"
        : "none";
    const suppliedSecret =
      basic?.clientSecret ??
      (typeof formClientSecret === "string" ? formClientSecret : null);
    if (
      client.tokenEndpointAuthMethod !== methodUsed ||
      !(await authenticateOAuthClient(client, suppliedSecret))
    ) {
      return oauthError("invalid_client", "Client authentication failed", 401, {
        "WWW-Authenticate": "Basic",
      });
    }

    const grantType = String(form.get("grant_type") ?? "");
    if (!client.grantTypes.includes(grantType)) {
      return oauthError(
        "unauthorized_client",
        "Grant type is not enabled for this client",
      );
    }

    const resource = String(form.get("resource") ?? getMcpResource(request));
    if (resource !== getMcpResource(request)) {
      return oauthError("invalid_target", "Unknown protected resource");
    }

    if (grantType === "authorization_code") {
      const code = String(form.get("code") ?? "");
      const redirectUri = String(form.get("redirect_uri") ?? "");
      const codeVerifier = String(form.get("code_verifier") ?? "");
      const grant = await redeemAuthorizationCode({
        code,
        clientId,
        redirectUri,
        codeVerifier,
      });
      if (!grant)
        return oauthError("invalid_grant", "Authorization code is invalid");
      if (grant.resource !== resource) {
        return oauthError(
          "invalid_target",
          "Authorization code targets another resource",
        );
      }

      const access = await createAccessToken({
        clientId,
        subject: "portfolio-owner",
        scopes: grant.scopes,
        resource,
        issuer: getIssuer(request),
      });
      const refresh = await issueRefreshToken({
        clientId,
        subject: "portfolio-owner",
        scopes: grant.scopes,
        resource,
      });
      return oauthJson({
        access_token: access.token,
        token_type: "Bearer",
        expires_in: access.expiresIn,
        refresh_token: refresh.token,
        scope: grant.scopes.join(" "),
      });
    }

    if (grantType === "refresh_token") {
      const refreshToken = String(form.get("refresh_token") ?? "");
      const rotated = await rotateRefreshToken(refreshToken, clientId);
      if (!rotated)
        return oauthError("invalid_grant", "Refresh token is invalid");
      const access = await createAccessToken({
        clientId,
        subject: rotated.current.subject,
        scopes: rotated.current.scopes,
        resource: rotated.current.resource,
        issuer: getIssuer(request),
      });
      return oauthJson({
        access_token: access.token,
        token_type: "Bearer",
        expires_in: access.expiresIn,
        refresh_token: rotated.replacement,
        scope: rotated.current.scopes.join(" "),
      });
    }

    if (grantType === "client_credentials") {
      const scopes = parseScopeRequest(String(form.get("scope") ?? ""));
      if (!scopes)
        return oauthError("invalid_scope", "Unsupported scope requested");
      const access = await createAccessToken({
        clientId,
        subject: "hermes",
        scopes,
        resource,
        issuer: getIssuer(request),
      });
      return oauthJson({
        access_token: access.token,
        token_type: "Bearer",
        expires_in: access.expiresIn,
        scope: scopes.join(" "),
      });
    }

    return oauthError("unsupported_grant_type", "Unsupported grant type");
  } catch (error) {
    console.error("OAuth token exchange failed", error);
    return oauthError("server_error", "Token service is unavailable", 503);
  }
}

export const OPTIONS = oauthOptions;
