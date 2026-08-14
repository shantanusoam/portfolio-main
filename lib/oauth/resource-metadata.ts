import { NextResponse } from "next/server";
import {
  getIssuer,
  getMcpResource,
  PORTFOLIO_SCOPES,
} from "@/lib/oauth/config";

export function protectedResourceMetadata(request: Request) {
  return NextResponse.json(
    {
      resource: getMcpResource(request),
      authorization_servers: [getIssuer(request)],
      scopes_supported: PORTFOLIO_SCOPES,
      bearer_methods_supported: ["header"],
      resource_documentation: `${getIssuer(request)}/docs/portfolio-control-plane`,
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=300",
      },
    },
  );
}
