export const PORTFOLIO_SCOPES = ["portfolio:read", "portfolio:write"] as const;
export type PortfolioScope = (typeof PORTFOLIO_SCOPES)[number];

function withProtocol(value: string) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function normalizeOrigin(value: string) {
  const url = new URL(withProtocol(value));
  return url.origin;
}

export function getPublicOrigin(request?: Request): string {
  const configured =
    process.env.PORTFOLIO_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;

  if (configured) return normalizeOrigin(configured);
  if (request) return new URL(request.url).origin;
  return "http://localhost:3000";
}

export function getIssuer(request?: Request) {
  return getPublicOrigin(request);
}

export function getMcpResource(request?: Request) {
  return `${getPublicOrigin(request)}/api/mcp`;
}

export function normalizeScopes(value: string | null | undefined) {
  const requested = (value ?? "")
    .split(/\s+/)
    .map((scope) => scope.trim())
    .filter(Boolean);
  const valid = requested.filter((scope): scope is PortfolioScope =>
    PORTFOLIO_SCOPES.includes(scope as PortfolioScope),
  );
  return Array.from(new Set(valid));
}

export function parseScopeRequest(
  value: string | null | undefined,
  fallback: PortfolioScope[] = [...PORTFOLIO_SCOPES],
) {
  if (!value?.trim()) return fallback;
  const requested = value.split(/\s+/).filter(Boolean);
  if (
    requested.some(
      (scope) => !PORTFOLIO_SCOPES.includes(scope as PortfolioScope),
    )
  ) {
    return null;
  }
  return normalizeScopes(value);
}

export function hasRequiredScopes(scopes: string[], required: string[]) {
  return required.every((scope) => scopes.includes(scope));
}

export function getOAuthConfiguration() {
  return {
    signingSecret: Boolean(
      process.env.OAUTH_SIGNING_SECRET || process.env.ADMIN_SESSION_SECRET,
    ),
    dedicatedSigningSecret: Boolean(process.env.OAUTH_SIGNING_SECRET),
    staticClaudeClient: Boolean(process.env.OAUTH_CLAUDE_CLIENT_ID),
    hermesClientCredentials: Boolean(
      process.env.MCP_HERMES_CLIENT_ID && process.env.MCP_HERMES_CLIENT_SECRET,
    ),
    hermesStaticToken: Boolean(process.env.MCP_HERMES_TOKEN),
    database: Boolean(process.env.DATABASE_URL),
  };
}
