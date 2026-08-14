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

export function getDbPool(): Pool | null {
  if (globalThis.__portfolioDbPool) return globalThis.__portfolioDbPool;

  const pool = createPool();
  if (!pool) return null;

  globalThis.__portfolioDbPool = pool;

  return pool;
}

export function getDb(): PortfolioDb | null {
  if (globalThis.__portfolioDb) return globalThis.__portfolioDb;

  const pool = getDbPool();
  if (!pool) return null;

  if (process.env.NODE_ENV !== "production") {
    globalThis.__portfolioDbPool = pool;
  }

  const db = drizzle(pool, { schema });
  globalThis.__portfolioDb = db;

  return db;
}
