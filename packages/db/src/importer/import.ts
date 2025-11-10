#!/usr/bin/env bun
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

import { createEnvAccessor } from "@devscast/config";

import { Engine } from "@/importer";

const env = createEnvAccessor([
  "BASANGO_SOURCE_DATABASE_HOST",
  "BASANGO_SOURCE_DATABASE_USER",
  "BASANGO_SOURCE_DATABASE_PASS",
  "BASANGO_SOURCE_DATABASE_NAME",
  "BASANGO_DATABASE_URL",
]);

async function askConfirmation(question: string, def = false) {
  const rl = createInterface({ input, output });
  const suffix = def ? "[Y/n]" : "[y/N]";
  const answer = await rl.question(`${question} ${suffix} `);
  rl.close();
  const v = String(answer || "")
    .trim()
    .toLowerCase();
  if (v === "y" || v === "yes") return true;
  if (v === "n" || v === "no") return false;
  return def;
}

async function main() {
  const ok = await askConfirmation("Do you want to continue?", false);
  if (!ok) {
    console.warn("Process aborted");
    process.exit(1);
  }

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
  } finally {
    await engine.close();
  }
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
