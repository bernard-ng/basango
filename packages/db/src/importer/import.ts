#!/usr/bin/env bun

import { env } from "@/config";
import { Engine } from "@/importer";

async function main() {
  const engine = new Engine(
    {
      database: env("BASANGO_SOURCE_DATABASE_NAME"),
      host: env("BASANGO_SOURCE_DATABASE_HOST"),
      password: env("BASANGO_SOURCE_DATABASE_PASS"),
      user: env("BASANGO_SOURCE_DATABASE_USER"),
    },
    {
      database: env("BASANGO_DATABASE_URL"),
    },
  );

  try {
    const tables = process.argv.slice(2);
    if (tables.length === 0) tables.push("user", "source", "article");
    for (const t of tables) {
      const count = await engine.import(t);
      console.log(`Imported ${count} records into ${t} table.`);
    }
    console.log("Import completed successfully");
    process.exit(0);
  } finally {
    await engine.close();
  }
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
