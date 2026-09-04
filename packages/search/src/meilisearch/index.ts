import { Meilisearch } from "meilisearch";

import type { SearchDocument } from "../indexer";
import { MeilisearchEngine } from "./engine";
import { MeilisearchIndexer } from "./indexer";

export type MeilisearchOptions = {
  apiKey?: string;
  indexName: string;
  taskTimeoutMs: number;
  url: string;
};

export function createMeilisearchAdapters(options: MeilisearchOptions) {
  const client = new Meilisearch({
    apiKey: options.apiKey,
    defaultWaitOptions: { timeout: options.taskTimeoutMs },
    host: options.url,
  });

  return {
    engine: new MeilisearchEngine(client.index<SearchDocument>(options.indexName)),
    indexer: new MeilisearchIndexer(client, options.indexName, options.taskTimeoutMs),
  };
}

export { MeilisearchEngine, buildSearchFilters, quoteFilterValue } from "./engine";
export { MeilisearchIndexer } from "./indexer";
export { ARTICLE_INDEX_SETTINGS, ARTICLE_RETRIEVED_ATTRIBUTES } from "./settings";
