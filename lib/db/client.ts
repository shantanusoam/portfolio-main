import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema";

type PortfolioDb = NodePgDatabase<typeof schema>;

declare global {
  // eslint-disable-next-line no-var
  var __portfolioDbPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __portfolioDb: PortfolioDb | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  return new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 30_000,
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

export function getDb(): PortfolioDb | null {
  if (globalThis.__portfolioDb) return globalThis.__portfolioDb;

  const pool = globalThis.__portfolioDbPool ?? createPool();
  if (!pool) return null;

  if (process.env.NODE_ENV !== "production") {
    globalThis.__portfolioDbPool = pool;
  }

  const db = drizzle(pool, { schema });
  if (process.env.NODE_ENV !== "production") {
    globalThis.__portfolioDb = db;
  }

  return db;
}
