import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import { getOAuthConfiguration } from "@/lib/oauth/config";

export const dynamic = "force-dynamic";

export default function AdminControlCenter() {
  const config = getOAuthConfiguration();
  const checks = [
    ["Database", config.database],
    ["OAuth signing", config.signingSecret],
    ["Dedicated OAuth secret", config.dedicatedSigningSecret],
    ["Claude fixed client", config.staticClaudeClient],
    ["Hermes client credentials", config.hermesClientCredentials],
    ["Hermes static-token fallback", config.hermesStaticToken],
  ] as const;

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-10 text-neutral-100">
      <div className="mx-auto max-w-5xl space-y-8">
        <AdminNav />
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
            Portfolio control plane
          </p>
          <h1 className="mt-2 text-3xl font-semibold">
            One place to publish, learn, and connect.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            Browser edits use your admin session. Remote agents use scoped OAuth
            tokens. No connector receives database credentials.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Blog", "Create and refine Signal Archive posts.", "/admin/blog"],
            [
              "Learning",
              "Manage tracks and durable field notes.",
              "/admin/learning",
            ],
            [
              "Connector guide",
              "Wire Claude or Hermes to the MCP tools.",
              "/docs/portfolio-control-plane",
            ],
          ].map(([title, description, href]) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl border border-neutral-800 bg-neutral-900 p-5 transition hover:border-neutral-600"
            >
              <h2 className="font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                {description}
              </p>
              <span className="mt-5 block text-sm text-emerald-300">
                Open →
              </span>
            </Link>
          ))}
        </div>

        <section className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Integration readiness</h2>
              <p className="mt-1 text-sm text-neutral-500">
                Only presence is shown; secret values never render.
              </p>
            </div>
            <code className="rounded bg-neutral-950 px-2 py-1 text-xs text-neutral-500">
              /api/mcp
            </code>
          </div>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {checks.map(([label, ready]) => (
              <li
                key={label}
                className="flex items-center justify-between rounded-lg bg-neutral-950 px-3 py-2 text-sm"
              >
                <span className="text-neutral-400">{label}</span>
                <span className={ready ? "text-emerald-300" : "text-amber-300"}>
                  {ready ? "ready" : "not set"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
