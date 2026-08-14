import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import { getMcpResource } from "@/lib/oauth/config";
import { verifyAccessToken } from "@/lib/oauth/tokens";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isLoginPage = pathname === "/admin/login";
  const isAuthApi = pathname === "/api/admin/login";

  if (isLoginPage || isAuthApi) {
    return NextResponse.next();
  }

  const connectorWriteRoute =
    (request.method === "POST" && pathname === "/api/admin/blog") ||
    (request.method === "GET" && pathname === "/api/admin/learning") ||
    (request.method === "POST" && pathname === "/api/admin/learning") ||
    (request.method === "POST" &&
      /^\/api\/admin\/learning\/[^/]+\/entries$/.test(pathname));

  if (connectorWriteRoute) {
    const authorization = request.headers.get("authorization");
    if (authorization?.startsWith("Bearer ")) {
      const bearer = authorization.slice(7).trim();
      const authInfo = await verifyAccessToken(bearer, {
        request,
        resource: getMcpResource(request),
        requiredScopes: ["portfolio:write"],
      });
      if (authInfo) return NextResponse.next();
    }
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  let valid = false;
  try {
    valid = await verifySessionToken(token);
  } catch {
    valid = false;
  }

  if (!valid) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401, headers: { "WWW-Authenticate": "Bearer" } },
      );
    }
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
