#!/usr/bin/env bun

import { config } from "@basango/domain/config";
import { logger } from "@basango/logger";
import { createMeilisearchAdapters } from "@basango/search/meilisearch";

import { db } from "#db/client";
import { SearchSynchronizer } from "#db/synchronizers/search";

import { runWithSearchProgress } from "./search-progress";

async function main() {
  const command = process.argv[2] ?? "drain";
  const { indexer } = createMeilisearchAdapters({
    apiKey: config.search.apiKey,
    indexName: config.search.indexName,
    taskTimeoutMs: config.search.taskTimeoutMs,
    url: config.search.url,
  });
  const synchronizer = new SearchSynchronizer(db, indexer, {
    batchMaxBytes: config.search.batchMaxBytes,
    batchSize: config.search.batchSize,
    indexName: config.search.indexName,
  });

  switch (command) {
    case "drain": {
      const synchronized = await synchronizer.drainDirty();
      logger.info({ synchronized }, "Search repair queue drained");
      break;
    }
    case "rebuild": {
      const verification = await runWithSearchProgress("Rebuilding search", (reportProgress) =>
        synchronizer.rebuild(reportProgress),
      );
      logger.info({ verification }, "Search index rebuilt");
      break;
    }
    case "verify": {
      const verification = await synchronizer.verify();
      logger.info({ verification }, "Search index verified");

      if (!verification.isSynchronized) {
        process.exitCode = 1;
      }
      break;
    }
    default:
      throw new Error(`Unknown search synchronization command: ${command}`);
  }
}

main().catch((error) => {
  logger.error({ error }, "Search synchronization failed");
  process.exitCode = 1;
});
