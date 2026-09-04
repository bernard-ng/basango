import { afterEach, describe, expect, test } from "bun:test";

import type { Database } from "@basango/db/client";
import { ArticleListSchema } from "@basango/domain/models/public";
import type { SearchEngine, SearchRequest } from "@basango/search/engine";
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";

import { createMcpServer } from "#api/mcp/init";
import { result } from "#api/mcp/tools/toolkit";

const ARTICLE_ID = "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc";
const CATEGORY_ID = "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bd";
const SOURCE_ID = "0198f0e2-5c2d-7bba-ae95-3d7eae12b2be";

const source = {
  articlesCount: 42,
  description: "Public-service media in the Democratic Republic of Congo.",
  displayName: "Radio Okapi",
  followed: false,
  id: SOURCE_ID,
  name: "radiookapi.net",
  url: "https://www.radiookapi.net",
};

const article = {
  body: "Contenu intégral réservé à la lecture détaillée de l'article.",
  categories: ["actualite"],
  category: {
    id: CATEGORY_ID,
    name: "Actualités",
    slug: "actualites",
  },
  excerpt: "Des nouvelles de Goma...",
  id: ARTICLE_ID,
  image: null,
  link: "https://www.radiookapi.net/article/goma",
  publishedAt: new Date("2026-09-01T08:30:00.000Z"),
  readingTime: 2,
  source: {
    displayName: source.displayName,
    id: source.id,
    name: source.name,
    url: source.url,
  },
  title: "Situation à Goma",
};

const meta = {
  current: 1,
  hasNext: false,
  hasPrevious: false,
  limit: 20,
  offset: 0,
  pages: 1,
  total: 1,
};

const activeConnections: Array<{
  client: Client;
  server: ReturnType<typeof createMcpServer>;
}> = [];

async function connect(engine: SearchEngine = unavailableSearchEngine) {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createMcpServer({} as Database, engine);
  const client = new Client({ name: "basango-mcp-test", version: "1.0.0" });

  await server.connect(serverTransport);
  await client.connect(clientTransport);
  activeConnections.push({ client, server });

  return client;
}

const unavailableSearchEngine: SearchEngine = {
  async search() {
    throw new Error("Search was not expected in this test");
  },
};

afterEach(async () => {
  await Promise.all(
    activeConnections.splice(0).map(async ({ client, server }) => {
      await client.close();
      await server.close();
    }),
  );
});

describe("Basango MCP server", () => {
  test("advertises only the read-only article surface", async () => {
    const client = await connect();
    const response = await client.listTools();

    expect(response.tools.map((tool) => tool.name)).toEqual([
      "list_articles",
      "search_articles",
      "get_article",
      "list_sources",
      "get_source",
      "list_categories",
    ]);

    for (const tool of response.tools) {
      expect(tool.annotations).toMatchObject({
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
        readOnlyHint: true,
      });
    }
  });

  test("coerces publication bounds for the existing article query", () => {
    const input = ArticleListSchema.parse({
      limit: 20,
      page: 1,
      publishedAfter: "2026-09-01T00:00:00+02:00",
      publishedBefore: "2026-09-01T23:59:59.999+02:00",
      sourceId: SOURCE_ID,
    });

    expect(input).toMatchObject({
      publishedAfter: new Date("2026-08-31T22:00:00.000Z"),
      publishedBefore: new Date("2026-09-01T21:59:59.999Z"),
      sourceId: SOURCE_ID,
    });
  });

  test("serializes query data without reshaping its schema", () => {
    const page = { items: [{ ...article, source }], meta };
    const response = result(page);

    expect(JSON.parse(response.content[0]?.text ?? "")).toEqual({
      items: [
        {
          ...article,
          publishedAt: "2026-09-01T08:30:00.000Z",
          source,
        },
      ],
      meta,
    });
  });

  test("routes text search through the search engine", async () => {
    let received: SearchRequest | undefined;
    const client = await connect({
      async search(request) {
        received = request;

        return { facets: {}, items: [], meta };
      },
    });
    const response = await client.callTool({
      arguments: { query: "Goma", sourceId: SOURCE_ID },
      name: "search_articles",
    });

    expect(response.isError).not.toBe(true);
    expect(received).toMatchObject({ limit: 20, page: 1, query: "Goma", sourceId: SOURCE_ID });
  });

  test("rejects malformed identifiers before querying the database", async () => {
    const client = await connect();
    const response = await client.callTool({
      arguments: { id: "not-a-uuid" },
      name: "get_article",
    });

    expect(response.isError).toBe(true);
  });
});
