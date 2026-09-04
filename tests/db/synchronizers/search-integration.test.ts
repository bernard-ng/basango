import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { Database } from "../../../packages/db/src/client";
import * as schema from "../../../packages/db/src/schema";
import { SearchSynchronizer } from "../../../packages/db/src/synchronizers/search";
import type {
  IndexVerification,
  SearchDocument,
  SearchIndexer,
} from "../../../packages/search/src/indexer";

const databaseUrl = process.env.BASANGO_SEARCH_SYNC_DATABASE_URL;
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : undefined;
const database = pool
  ? (drizzle(pool, {
      casing: "snake_case",
      schema,
    }) as Database)
  : undefined;
const { articleSearchOutbox, articles, categories, sources } = schema;

describe.skipIf(!database)("SearchSynchronizer integration", () => {
  beforeEach(async () => {
    await database?.delete(articleSearchOutbox);
    await database?.delete(articles);
    await database?.delete(categories);
    await database?.delete(sources);
  });

  afterAll(async () => {
    await pool?.end();
  });

  test("upserts canonical documents and deletes missing documents", async () => {
    const db = requiredDatabase();
    const indexer = new MemorySearchIndexer("articles");
    const articleId = "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc";
    const deletedId = "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bd";
    await seedArticle(db, articleId);
    await db.insert(articleSearchOutbox).values([
      { articleId, operation: "upsert" },
      { articleId: deletedId, operation: "delete" },
    ]);
    indexer.documents("articles").set(deletedId, document(deletedId));
    const synchronizer = createSynchronizer(db, indexer);

    await synchronizer.synchronizeDirty();

    expect([...indexer.documents("articles").keys()]).toEqual([articleId]);
    expect(await db.select().from(articleSearchOutbox)).toEqual([]);
  });

  test("records a bounded retry after an indexing failure", async () => {
    const db = requiredDatabase();
    const indexer = new MemorySearchIndexer("articles");
    const articleId = "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc";
    await seedArticle(db, articleId);
    await db.insert(articleSearchOutbox).values({ articleId, operation: "upsert" });
    indexer.failNextUpsert = true;
    const synchronizer = createSynchronizer(db, indexer);

    await expect(synchronizer.synchronizeDirty()).rejects.toThrow("simulated failure");

    const [entry] = await db.select().from(articleSearchOutbox);
    expect(entry).toMatchObject({ articleId, attempts: 1, lastError: "simulated failure" });
    expect(entry?.availableAt.getTime()).toBeGreaterThan(Date.now() - 1_000);
  });

  test("rebuilds through bounded batches and swaps the verified index", async () => {
    const db = requiredDatabase();
    const indexer = new MemorySearchIndexer("articles");
    await Promise.all([
      seedArticle(db, "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc"),
      seedArticle(db, "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bd"),
      seedArticle(db, "0198f0e2-5c2d-7bba-ae95-3d7eae12b2be"),
    ]);
    const synchronizer = createSynchronizer(db, indexer, 2);

    const verification = await synchronizer.rebuild();

    expect(verification).toEqual({
      databaseDocumentCount: 3,
      indexDocumentCount: 3,
      isSynchronized: true,
    });
    expect(indexer.largestUpsert).toBe(2);
    expect(indexer.swapCount).toBe(1);
  });
});

class MemorySearchIndexer implements SearchIndexer {
  failNextUpsert = false;
  largestUpsert = 0;
  swapCount = 0;
  private readonly indexes = new Map<string, Map<string, SearchDocument>>();

  constructor(private readonly stableIndexName: string) {
    this.indexes.set(stableIndexName, new Map());
  }

  async configure(indexName = this.stableIndexName): Promise<void> {
    this.indexes.set(indexName, this.indexes.get(indexName) ?? new Map());
  }

  async createIndex(indexName: string): Promise<void> {
    this.indexes.set(indexName, new Map());
  }

  async deleteDocuments(ids: readonly string[], indexName = this.stableIndexName): Promise<void> {
    const documents = this.documents(indexName);

    for (const id of ids) {
      documents.delete(id);
    }
  }

  async deleteIndex(indexName: string): Promise<void> {
    this.indexes.delete(indexName);
  }

  async swapIndexes(firstIndexName: string, secondIndexName: string): Promise<void> {
    const first = this.documents(firstIndexName);
    const second = this.documents(secondIndexName);
    this.indexes.set(firstIndexName, second);
    this.indexes.set(secondIndexName, first);
    this.swapCount += 1;
  }

  async upsertDocuments(
    documents: readonly SearchDocument[],
    indexName = this.stableIndexName,
  ): Promise<void> {
    if (this.failNextUpsert) {
      this.failNextUpsert = false;
      throw new Error("simulated failure");
    }

    this.largestUpsert = Math.max(this.largestUpsert, documents.length);
    const index = this.documents(indexName);

    for (const item of documents) {
      index.set(item.id, item);
    }
  }

  async verify(indexName = this.stableIndexName): Promise<IndexVerification> {
    return { documentCount: this.documents(indexName).size, indexName };
  }

  documents(indexName: string): Map<string, SearchDocument> {
    const documents = this.indexes.get(indexName);

    if (!documents) {
      throw new Error(`Index ${indexName} does not exist`);
    }

    return documents;
  }
}

function createSynchronizer(db: Database, indexer: SearchIndexer, batchSize = 100) {
  return new SearchSynchronizer(db, indexer, {
    batchMaxBytes: 1_000_000,
    batchSize,
    indexName: "articles",
  });
}

function document(id: string): SearchDocument {
  return {
    body: "body",
    categories: [],
    categoryId: null,
    categoryName: null,
    categorySlug: null,
    excerpt: "body...",
    id,
    image: null,
    link: `https://example.com/${id}`,
    publishedAt: "2026-09-01T00:00:00.000Z",
    publishedAtTimestamp: 1_788_220_800,
    readingTime: 1,
    sentiment: "neutral",
    sourceDisplayName: null,
    sourceId: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bf",
    sourceName: "Source",
    sourceUrl: "https://example.com",
    title: `Article ${id}`,
  };
}

function requiredDatabase(): Database {
  if (!database) {
    throw new Error("BASANGO_SEARCH_SYNC_DATABASE_URL is required");
  }

  return database;
}

async function seedArticle(db: Database, id: string): Promise<void> {
  const sourceId = "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bf";
  await db
    .insert(sources)
    .values({ id: sourceId, name: "Source", url: "https://example.com" })
    .onConflictDoNothing();
  await db.insert(articles).values({
    body: `Body ${id}`,
    hash: createHash("md5").update(id).digest("hex"),
    id,
    link: `https://example.com/${id}`,
    publishedAt: new Date("2026-09-01T00:00:00.000Z"),
    sentiment: "neutral",
    sourceId,
    title: `Article ${id}`,
  });
}
