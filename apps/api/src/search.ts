import { db } from "@basango/db/client";
import { SearchSynchronizer } from "@basango/db/synchronizers/search";
import { config } from "@basango/domain/config";
import { createMeilisearchAdapters } from "@basango/search/meilisearch";

const adapters = createMeilisearchAdapters({
  apiKey: config.search.apiKey,
  indexName: config.search.indexName,
  taskTimeoutMs: config.search.taskTimeoutMs,
  url: config.search.url,
});

export const searchEngine = adapters.engine;

export const searchSynchronizer = new SearchSynchronizer(db, adapters.indexer, {
  batchMaxBytes: config.search.batchMaxBytes,
  batchSize: config.search.batchSize,
  indexName: config.search.indexName,
});
