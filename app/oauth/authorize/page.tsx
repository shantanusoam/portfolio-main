import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifySessionToken } from "@/lib/admin/auth";
import {
  AuthorizationRequestError,
  validateAuthorizationRequest,
} from "@/lib/oauth/authorize";

export const dynamic = "force-dynamic";

function toSearchParams(values: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return params;
}

export default async function OAuthAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = toSearchParams(await searchParams);
  let authorization;
  try {
    authorization = await validateAuthorizationRequest(params);
  } catch (error) {
    const message =
      error instanceof AuthorizationRequestError
        ? error.message
        : "The authorization service is not configured yet.";
    return (
      <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-neutral-100">
        <section className="w-full max-w-lg rounded-2xl border border-red-900/60 bg-neutral-900 p-7 shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-400">
            Connector request rejected
          </p>
          <h1 className="mt-3 text-2xl font-semibold">
            This connection cannot continue.
          </h1>
          <p className="mt-3 text-sm leading-6 text-neutral-400">{message}</p>
        </section>
      </main>
    );
  }

  const session = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  let authenticated = false;
  try {
    authenticated = await verifySessionToken(session);
  } catch {
    authenticated = false;
  }
  if (!authenticated) {
    const next = `/oauth/authorize?${params.toString()}`;
    redirect(`/admin/login?next=${encodeURIComponent(next)}`);
  }

  const destination = new URL(authorization.redirectUri);
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-12 text-neutral-100">
      <section className="w-full max-w-xl overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="border-b border-neutral-800 bg-neutral-950/60 px-7 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Portfolio control plane
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Allow this connector?</h1>
        </div>

        <div className="space-y-6 px-7 py-6">
          <div>
            <p className="text-base font-medium">{authorization.client.name}</p>
            <p className="mt-1 text-sm text-neutral-500">
              Return destination: {destination.hostname}
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
              Requested permissions
            </p>
            <ul className="mt-3 space-y-2 text-sm text-neutral-300">
              {authorization.scopes.includes("portfolio:read") && (
                <li>Read portfolio learning and content context.</li>
              )}
              {authorization.scopes.includes("portfolio:write") && (
                <li>
                  Create blog posts and learning checkpoints on your behalf.
                </li>
              )}
            </ul>
          </div>

          <p className="text-xs leading-5 text-neutral-500">
            Access tokens expire after one hour. Refresh tokens rotate on every
            use. You can decline without changing your portfolio.
          </p>

          <form
            action="/api/oauth/authorize"
            method="post"
            className="flex gap-3"
          >
            {Array.from(params.entries()).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}
            <button
              type="submit"
              name="decision"
              value="deny"
              className="flex-1 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:border-neutral-500"
            >
              Decline
            </button>
            <button
              type="submit"
              name="decision"
              value="allow"
              className="flex-1 rounded-lg bg-emerald-300 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-200"
            >
              Allow connector
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
