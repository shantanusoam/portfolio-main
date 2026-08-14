import Link from "next/link";
import { getPublicOrigin } from "@/lib/oauth/config";

const codeClass =
  "mt-4 overflow-x-auto rounded-xl border border-neutral-800 bg-black p-4 font-mono text-xs leading-6 text-emerald-200";

export default function PortfolioControlPlaneDocs() {
  const origin = getPublicOrigin();

  return (
    <main className="min-h-screen bg-neutral-950 px-5 py-16 text-neutral-100">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-200"
        >
          ← Portfolio
        </Link>
        <p className="mt-12 text-xs font-semibold uppercase tracking-[0.22em] text-emerald-400">
          System guide
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Portfolio control plane
        </h1>
        <p className="mt-5 text-lg leading-8 text-neutral-400">
          One guarded write boundary for the admin UI, Claude, and browserless
          automation. Connectors get scoped tools—not database credentials.
        </p>

        <div className="mt-12 space-y-12 text-sm leading-7 text-neutral-300">
          <section>
            <h2 className="text-xl font-semibold text-white">
              Claude connector
            </h2>
            <p className="mt-3">
              Add the remote MCP URL below. Claude can discover this server,
              register a client, open the portfolio consent screen, and complete
              authorization-code + PKCE.
            </p>
            <pre className={codeClass}>{origin}/api/mcp</pre>
            <p className="mt-3 text-neutral-500">
              If the connector form asks for supplied credentials, configure the
              fixed Claude client environment variables and enter the matching
              id and secret.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              Hermes without a browser
            </h2>
            <p className="mt-3">
              Hermes exchanges its client id and secret for a scoped one-hour
              token. Cache it, renew before expiry, and send it as a Bearer
              token on MCP requests.
            </p>
            <pre
              className={codeClass}
            >{`curl -u "$MCP_HERMES_CLIENT_ID:$MCP_HERMES_CLIENT_SECRET" \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=client_credentials" \\
  -d "scope=portfolio:read portfolio:write" \\
  -d "resource=${origin}/api/mcp" \\
  "${origin}/api/oauth/token"`}</pre>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              Available tools
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                <code className="text-emerald-300">create_blog_post</code>
                <p className="mt-2 text-neutral-500">
                  Turns a rough thought and structured draft into an on-brand
                  Signal Archive post.
                </p>
              </div>
              <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
                <code className="text-emerald-300">add_learning_entry</code>
                <p className="mt-2 text-neutral-500">
                  Adds a durable field note and creates the learning track when
                  it does not exist.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">
              Security boundary
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-neutral-400">
              <li>
                Public learning reads are separated from every write route.
              </li>
              <li>
                Authorization codes require S256 PKCE, expire in five minutes,
                and are single use.
              </li>
              <li>
                Access tokens expire in one hour; browser refresh tokens rotate
                on use.
              </li>
              <li>
                Hermes secrets live only in environment/secret storage, never
                this repository.
              </li>
              <li>
                MCP tools call protected admin APIs and never import the
                database.
              </li>
            </ul>
          </section>
        </div>
      </article>
    </main>
  );
}
