import { z } from "zod";
import { isSafeRedirectUri, registerOAuthClient } from "@/lib/oauth/clients";
import { oauthError, oauthJson, oauthOptions } from "@/lib/oauth/http";

const registrationSchema = z.object({
  client_name: z.string().trim().min(1).max(120).default("MCP client"),
  redirect_uris: z
    .array(z.string().max(500))
    .min(1)
    .max(10)
    .refine((uris) => uris.every(isSafeRedirectUri), "Unsafe redirect URI"),
  grant_types: z
    .array(z.enum(["authorization_code", "refresh_token"]))
    .default(["authorization_code", "refresh_token"]),
  response_types: z.array(z.literal("code")).default(["code"]),
  token_endpoint_auth_method: z
    .enum(["none", "client_secret_basic", "client_secret_post"])
    .default("none"),
});

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success) {
    return oauthError(
      "invalid_client_metadata",
      parsed.error.issues[0]?.message ?? "Invalid client metadata",
    );
  }

  try {
    const client = await registerOAuthClient({
      name: parsed.data.client_name,
      redirectUris: parsed.data.redirect_uris,
      grantTypes: Array.from(new Set(parsed.data.grant_types)),
      tokenEndpointAuthMethod: parsed.data.token_endpoint_auth_method,
    });
    const now = Math.floor(Date.now() / 1_000);
    return oauthJson(
      {
        client_id: client.clientId,
        ...(client.clientSecret
          ? { client_secret: client.clientSecret, client_secret_expires_at: 0 }
          : {}),
        client_id_issued_at: now,
        client_name: parsed.data.client_name,
        redirect_uris: parsed.data.redirect_uris,
        grant_types: parsed.data.grant_types,
        response_types: parsed.data.response_types,
        token_endpoint_auth_method: parsed.data.token_endpoint_auth_method,
      },
      201,
    );
  } catch (error) {
    console.error("OAuth client registration failed", error);
    const atLimit =
      error instanceof Error && error.message.includes("registration limit");
    return oauthError(
      atLimit ? "temporarily_unavailable" : "server_error",
      atLimit ? error.message : "Client registration failed",
      atLimit ? 429 : 503,
    );
  }
}

export const OPTIONS = oauthOptions;
