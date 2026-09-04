import { describe, expect, test } from "bun:test";

import {
  ARTICLE_INDEX_SETTINGS,
  createMeilisearchAdapters,
  quoteFilterValue,
} from "../../packages/search/src/meilisearch";

describe("Meilisearch article search", () => {
  test("keeps title ahead of body and limits facets to product filters", () => {
    expect(ARTICLE_INDEX_SETTINGS.searchableAttributes).toEqual(["title", "body"]);
    expect(ARTICLE_INDEX_SETTINGS.filterableAttributes).toEqual([
      "sourceId",
      "categoryId",
      "sentiment",
      "publishedAtTimestamp",
    ]);
    expect(ARTICLE_INDEX_SETTINGS.displayedAttributes).not.toContain("body");
    expect(ARTICLE_INDEX_SETTINGS.rankingRules.at(-1)).toBe("publishedAtTimestamp:desc");
  });

  test("escapes quoted Meilisearch filter values", () => {
    expect(quoteFilterValue('source\\" OR sentiment = "positive')).toBe(
      '"source\\\\\\" OR sentiment = \\"positive"',
    );
  });

  test("normalizes hits, facets, filters, and pagination", async () => {
    let requestBody: Record<string, unknown> | undefined;
    const server = Bun.serve({
      async fetch(request) {
        requestBody = (await request.json()) as Record<string, unknown>;

        return Response.json({
          facetDistribution: { sentiment: { neutral: 1 } },
          hits: [
            {
              _formatted: {
                excerpt: "Résumé sur \uE000Goma\uE001",
                title: "\uE000Goma\uE001 accueille un sommet",
              },
              _rankingScore: 0.87,
              categories: ["Politique"],
              categoryId: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc",
              categoryName: "Politique",
              categorySlug: "politique",
              excerpt: "Résumé",
              id: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bd",
              image: null,
              link: "https://example.com/article",
              publishedAt: "2026-09-01T08:30:00.000Z",
              readingTime: 3,
              sentiment: "neutral",
              sourceDisplayName: "Example",
              sourceId: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2be",
              sourceName: "Example News",
              sourceUrl: "https://example.com",
              title: "Goma",
            },
          ],
          totalHits: 21,
          totalPages: 3,
        });
      },
      hostname: "127.0.0.1",
      port: 0,
    });

    try {
      const { engine } = createMeilisearchAdapters({
        indexName: "articles",
        taskTimeoutMs: 1_000,
        url: server.url.origin,
      });
      const result = await engine.search({
        facets: ["sentiment"],
        limit: 10,
        page: 2,
        publishedAfter: new Date("2026-09-01T00:00:00.000Z"),
        query: "Goma",
        sentiment: "neutral",
      });

      expect(requestBody).toMatchObject({
        attributesToCrop: ["excerpt"],
        attributesToHighlight: ["title", "excerpt"],
        cropLength: 36,
        facets: ["sentiment"],
        filter: ['sentiment = "neutral"', "publishedAtTimestamp >= 1788220800"],
        highlightPostTag: "\uE001",
        highlightPreTag: "\uE000",
        hitsPerPage: 10,
        page: 2,
        q: "Goma",
      });
      expect(result.items[0]).toMatchObject({
        category: { name: "Politique" },
        highlights: {
          excerpt: [
            { highlighted: false, text: "Résumé sur " },
            { highlighted: true, text: "Goma" },
          ],
          title: [
            { highlighted: true, text: "Goma" },
            { highlighted: false, text: " accueille un sommet" },
          ],
        },
        publishedAt: new Date("2026-09-01T08:30:00.000Z"),
        score: 0.87,
        source: { name: "Example News" },
        title: "Goma",
      });
      expect(result.facets).toEqual({ sentiment: { neutral: 1 } });
      expect(result.meta).toMatchObject({ current: 2, hasNext: true, pages: 3, total: 21 });
    } finally {
      await server.stop(true);
    }
  });

  test("rejects malformed Meilisearch hits", async () => {
    const server = Bun.serve({
      fetch() {
        return Response.json({
          hits: [{ id: "incomplete" }],
          totalHits: 1,
          totalPages: 1,
        });
      },
      hostname: "127.0.0.1",
      port: 0,
    });

    try {
      const { engine } = createMeilisearchAdapters({
        indexName: "articles",
        taskTimeoutMs: 1_000,
        url: server.url.origin,
      });

      await expect(engine.search({ limit: 10, page: 1, query: "incomplete" })).rejects.toThrow();
    } finally {
      await server.stop(true);
    }
  });
});
