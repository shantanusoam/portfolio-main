import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is required");

const pool = new Pool({
  connectionString,
  max: 1,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  try {
    await migrate(drizzle(pool), { migrationsFolder: "./db/migrations" });
    console.log("Portfolio database migrations are current.");
  } finally {
    await pool.end();
  }
}

void main();
