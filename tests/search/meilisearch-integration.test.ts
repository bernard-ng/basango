import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import type { SearchDocument } from "../../packages/search/src/indexer";
import { createMeilisearchAdapters } from "../../packages/search/src/meilisearch";

const runIntegration = process.env.BASANGO_MEILISEARCH_INTEGRATION === "true";
const indexName = `articles_test_${Date.now()}`;
const options = {
  apiKey: process.env.BASANGO_MEILISEARCH_API_KEY,
  indexName,
  taskTimeoutMs: 10_000,
  url: process.env.BASANGO_MEILISEARCH_URL ?? "http://127.0.0.1:7700",
};
const { engine, indexer } = createMeilisearchAdapters(options);

describe.skipIf(!runIntegration)("Meilisearch integration", () => {
  beforeAll(async () => {
    await indexer.configure();
  });

  afterAll(async () => {
    await indexer.deleteIndex(indexName);
  });

  test("indexes, searches, filters, facets, and deletes articles", async () => {
    await indexer.upsertDocuments([
      document("0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc", "Goma accueille un sommet", "neutral"),
      document("0198f0e2-5c2d-7bba-ae95-3d7eae12b2bd", "Kinshasa prépare un forum", "positive"),
    ]);

    const result = await engine.search({
      facets: ["sentiment"],
      limit: 20,
      page: 1,
      query: "sommet",
      sentiment: "neutral",
    });

    expect(result.items.map((item) => item.title)).toEqual(["Goma accueille un sommet"]);
    expect(result.facets.sentiment).toEqual({ neutral: 1 });

    await indexer.deleteDocuments(["0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc"]);
    expect((await indexer.verify()).documentCount).toBe(1);
  });

  test("surfaces asynchronous indexing task failures", async () => {
    await expect(
      indexer.upsertDocuments([document("invalid id", "Invalid article", "neutral")]),
    ).rejects.toThrow(/Meilisearch task .* failed/);
  });
});

function document(
  id: string,
  title: string,
  sentiment: SearchDocument["sentiment"],
): SearchDocument {
  return {
    body: `${title}. Texte intégral de démonstration.`,
    categories: ["actualité"],
    categoryId: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2ba",
    categoryName: "Actualités",
    categorySlug: "actualites",
    excerpt: title,
    id,
    image: null,
    link: `https://example.com/${id}`,
    publishedAt: "2026-09-01T00:00:00.000Z",
    publishedAtTimestamp: 1_788_220_800,
    readingTime: 2,
    sentiment,
    sourceDisplayName: "Example",
    sourceId: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2be",
    sourceName: "Example News",
    sourceUrl: "https://example.com",
    title,
  };
}
