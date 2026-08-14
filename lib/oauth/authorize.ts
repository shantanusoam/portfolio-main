import {
  clientAllowsRedirect,
  getOAuthClient,
  type OAuthClient,
} from "@/lib/oauth/clients";
import { getMcpResource, parseScopeRequest } from "@/lib/oauth/config";

export type ValidAuthorizationRequest = {
  client: OAuthClient;
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  scopes: string[];
  resource: string;
  state: string;
};

export class AuthorizationRequestError extends Error {
  readonly oauthError: string;

  constructor(oauthError: string, message: string) {
    super(message);
    this.name = "AuthorizationRequestError";
    this.oauthError = oauthError;
  }
}

export async function validateAuthorizationRequest(
  values: URLSearchParams,
  request?: Request,
): Promise<ValidAuthorizationRequest> {
  const clientId = values.get("client_id") ?? "";
  if (!clientId)
    throw new AuthorizationRequestError("invalid_request", "Missing client_id");

  const client = await getOAuthClient(clientId);
  if (!client)
    throw new AuthorizationRequestError(
      "unauthorized_client",
      "Unknown client",
    );
  if (!client.grantTypes.includes("authorization_code")) {
    throw new AuthorizationRequestError(
      "unauthorized_client",
      "Client cannot use authorization code flow",
    );
  }

  const redirectUri = values.get("redirect_uri") ?? "";
  if (!clientAllowsRedirect(client, redirectUri)) {
    throw new AuthorizationRequestError(
      "invalid_request",
      "Redirect URI is not registered",
    );
  }
  if (values.get("response_type") !== "code") {
    throw new AuthorizationRequestError(
      "unsupported_response_type",
      "Only code is supported",
    );
  }

  const codeChallenge = values.get("code_challenge") ?? "";
  if (
    values.get("code_challenge_method") !== "S256" ||
    !/^[A-Za-z0-9_-]{43,128}$/.test(codeChallenge)
  ) {
    throw new AuthorizationRequestError(
      "invalid_request",
      "PKCE with a valid S256 code challenge is required",
    );
  }

  const scopes = parseScopeRequest(values.get("scope"));
  if (!scopes)
    throw new AuthorizationRequestError("invalid_scope", "Unsupported scope");

  const resource = values.get("resource") || getMcpResource(request);
  if (resource !== getMcpResource(request)) {
    throw new AuthorizationRequestError(
      "invalid_target",
      "Unknown protected resource",
    );
  }

  return {
    client,
    clientId,
    redirectUri,
    codeChallenge,
    scopes,
    resource,
    state: values.get("state") ?? "",
  };
}

export function authorizationErrorRedirect(
  redirectUri: string,
  error: string,
  description: string,
  state: string,
) {
  const target = new URL(redirectUri);
  target.searchParams.set("error", error);
  target.searchParams.set("error_description", description);
  if (state) target.searchParams.set("state", state);
  return target;
}
