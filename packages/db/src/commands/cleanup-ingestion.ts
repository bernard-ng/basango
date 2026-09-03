#!/usr/bin/env bun

import { logger } from "@basango/logger";

import { connectDb } from "#db/client";
import { pruneIngestionLifecycle } from "#db/queries/ingestion/maintenance";

import {
  createIngestionRetentionCutoff,
  parseIngestionCleanupOptions,
} from "./ingestion-cleanup-options";

const HELP = `Usage: bun run ingestion:cleanup [--retention-days <days>]

Delete expired ingestion events, terminal runs, and stale agent health records.
The retention period defaults to 5 days. Articles and source data are never deleted.`;

async function main() {
  const options = parseIngestionCleanupOptions(Bun.argv.slice(2));

  if (options.help) {
    process.stdout.write(`${HELP}\n`);
    return;
  }

  const cutoff = createIngestionRetentionCutoff(options.retentionDays);
  const db = await connectDb();
  const result = await pruneIngestionLifecycle(db, { cutoff });

  logger.info(
    {
      cutoff: cutoff.toISOString(),
      retentionDays: options.retentionDays,
      ...result,
    },
    "Ingestion lifecycle cleanup completed",
  );
}

main().catch((error) => {
  logger.error({ error }, "Ingestion lifecycle cleanup failed");
  process.exit(1);
});
