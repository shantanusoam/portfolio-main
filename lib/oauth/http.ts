import { NextResponse } from "next/server";

const TOKEN_HEADERS = {
  "Cache-Control": "no-store",
  Pragma: "no-cache",
  "Access-Control-Allow-Origin": "*",
};

export function oauthError(
  error: string,
  errorDescription: string,
  status = 400,
  headers: HeadersInit = {},
) {
  return NextResponse.json(
    { error, error_description: errorDescription },
    { status, headers: { ...TOKEN_HEADERS, ...headers } },
  );
}

export function oauthJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: TOKEN_HEADERS });
}

export function oauthOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Authorization, Content-Type, MCP-Protocol-Version",
      "Access-Control-Max-Age": "86400",
    },
  });
}
