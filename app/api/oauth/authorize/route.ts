import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import {
  authorizationErrorRedirect,
  AuthorizationRequestError,
  validateAuthorizationRequest,
} from "@/lib/oauth/authorize";
import { issueAuthorizationCode } from "@/lib/oauth/grants";

export async function POST(request: Request) {
  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  let authenticated = false;
  try {
    authenticated = await verifySessionToken(session);
  } catch {
    authenticated = false;
  }
  if (!authenticated) {
    return NextResponse.json(
      { error: "Admin session required" },
      { status: 401 },
    );
  }

  const form = await request.formData();
  const values = new URLSearchParams();
  form.forEach((value, key) => {
    if (typeof value === "string" && key !== "decision") values.set(key, value);
  });

  try {
    const authorization = await validateAuthorizationRequest(values, request);
    if (form.get("decision") !== "allow") {
      return NextResponse.redirect(
        authorizationErrorRedirect(
          authorization.redirectUri,
          "access_denied",
          "The portfolio owner declined access",
          authorization.state,
        ),
        303,
      );
    }

    const code = await issueAuthorizationCode({
      clientId: authorization.clientId,
      redirectUri: authorization.redirectUri,
      codeChallenge: authorization.codeChallenge,
      scopes: authorization.scopes,
      resource: authorization.resource,
    });
    const target = new URL(authorization.redirectUri);
    target.searchParams.set("code", code);
    if (authorization.state)
      target.searchParams.set("state", authorization.state);
    return NextResponse.redirect(target, 303);
  } catch (error) {
    if (error instanceof AuthorizationRequestError) {
      return NextResponse.json(
        { error: error.oauthError, error_description: error.message },
        { status: 400 },
      );
    }
    console.error("OAuth authorization failed", error);
    return NextResponse.json(
      { error: "Authorization service unavailable" },
      { status: 503 },
    );
  }
}
