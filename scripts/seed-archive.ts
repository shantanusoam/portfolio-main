import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const { archiveArticles } = await import("@/lib/archive/data");
  const { upsertArchiveArticles } = await import("@/lib/archive/store");
  await upsertArchiveArticles(archiveArticles);
  process.stdout.write(`Seeded ${archiveArticles.length} archive articles.\n`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
