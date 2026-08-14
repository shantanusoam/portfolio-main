import { NextResponse } from "next/server";
import {
  getIssuer,
  getMcpResource,
  PORTFOLIO_SCOPES,
} from "@/lib/oauth/config";
import { oauthOptions } from "@/lib/oauth/http";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const issuer = getIssuer(request);
  return NextResponse.json(
    {
      issuer,
      authorization_endpoint: `${issuer}/oauth/authorize`,
      token_endpoint: `${issuer}/api/oauth/token`,
      registration_endpoint: `${issuer}/api/oauth/register`,
      response_types_supported: ["code"],
      grant_types_supported: [
        "authorization_code",
        "refresh_token",
        "client_credentials",
      ],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: [
        "none",
        "client_secret_basic",
        "client_secret_post",
      ],
      scopes_supported: PORTFOLIO_SCOPES,
      resource_indicators_supported: true,
      service_documentation: `${issuer}/docs/portfolio-control-plane`,
      protected_resources: [getMcpResource(request)],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}

export const OPTIONS = oauthOptions;
