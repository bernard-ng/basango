import { describe, expect, test } from "bun:test";

import { createMeilisearchAdapters } from "../../packages/search/src/meilisearch";

describe("Meilisearch resume lookups", () => {
  test("requests only IDs with an explicit limit and skips empty requests", async () => {
    const requests: unknown[] = [];
    const server = Bun.serve({
      fetch(request) {
        const url = new URL(request.url);
        expect(url.pathname).toBe("/indexes/articles/documents");
        requests.push(Object.fromEntries(url.searchParams));

        return Response.json({ limit: 2, offset: 0, results: [{ id: "existing" }], total: 1 });
      },
      hostname: "127.0.0.1",
      port: 0,
    });
    const { indexer } = createMeilisearchAdapters({
      indexName: "articles",
      taskTimeoutMs: 1_000,
      url: server.url.toString(),
    });

    try {
      expect(await indexer.getExistingDocumentIds([])).toEqual([]);
      expect(await indexer.getExistingDocumentIds(["existing", "missing"])).toEqual(["existing"]);
      expect(requests).toEqual([{ fields: "id", ids: "existing,missing", limit: "2" }]);
    } finally {
      server.stop(true);
    }
  });

  test("fails closed when the existence lookup fails", async () => {
    const server = Bun.serve({
      fetch() {
        return Response.json({ code: "index_not_found", message: "Unavailable" }, { status: 404 });
      },
      hostname: "127.0.0.1",
      port: 0,
    });
    const { indexer } = createMeilisearchAdapters({
      indexName: "articles",
      taskTimeoutMs: 1_000,
      url: server.url.toString(),
    });

    try {
      await expect(indexer.getExistingDocumentIds(["existing"])).rejects.toThrow();
    } finally {
      server.stop(true);
    }
  });
});
