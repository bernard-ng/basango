import type { SearchDocument } from "@basango/search/indexer";
import { and, asc, count, eq, gt, inArray, lte, sql } from "drizzle-orm";

import type { Database } from "#db/client";
import { articleSearchOutbox, articles, categories, sources } from "#db/schema";

type SearchDocumentRow = {
  body: string;
  categories: string[] | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  excerpt: string | null;
  id: string;
  image: string | null;
  link: string;
  publishedAt: Date;
  readingTime: number | null;
  sentiment: "negative" | "neutral" | "positive";
  sourceDisplayName: string | null;
  sourceId: string;
  sourceName: string;
  sourceUrl: string;
  title: string;
};

type SearchOutboxDatabase = Pick<Database, "execute">;

export type ArticleSearchOutboxEntry = typeof articleSearchOutbox.$inferSelect;

const searchDocumentSelection = {
  body: articles.body,
  categories: articles.categories,
  categoryId: categories.id,
  categoryName: categories.name,
  categorySlug: categories.slug,
  excerpt: articles.excerpt,
  id: articles.id,
  image: articles.image,
  link: articles.link,
  publishedAt: articles.publishedAt,
  readingTime: articles.readingTime,
  sentiment: articles.sentiment,
  sourceDisplayName: sources.displayName,
  sourceId: sources.id,
  sourceName: sources.name,
  sourceUrl: sources.url,
  title: articles.title,
} as const;

export async function getArticleSearchDocument(
  db: Database,
  articleId: string,
): Promise<SearchDocument | undefined> {
  const [row] = await searchDocumentQuery(db).where(eq(articles.id, articleId)).limit(1);

  return row ? mapSearchDocument(row) : undefined;
}

export async function getArticleSearchDocuments(
  db: Database,
  articleIds: readonly string[],
): Promise<SearchDocument[]> {
  if (articleIds.length === 0) {
    return [];
  }

  const rows = await searchDocumentQuery(db).where(inArray(articles.id, [...articleIds]));

  return rows.map(mapSearchDocument);
}

export async function getArticleSearchDocumentBatch(
  db: Database,
  options: { afterId?: string; limit: number },
): Promise<SearchDocument[]> {
  const rows = await searchDocumentQuery(db)
    .where(options.afterId ? gt(articles.id, options.afterId) : undefined)
    .orderBy(asc(articles.id))
    .limit(options.limit);

  return rows.map(mapSearchDocument);
}

export async function getArticleSearchDocumentIds(
  db: Database,
  options: {
    afterId?: string;
    categoryId?: string;
    limit: number;
    sourceId?: string;
  },
): Promise<string[]> {
  const filters = [
    options.afterId ? gt(articles.id, options.afterId) : undefined,
    options.categoryId ? eq(articles.categoryId, options.categoryId) : undefined,
    options.sourceId ? eq(articles.sourceId, options.sourceId) : undefined,
  ].filter((filter) => filter !== undefined);
  const rows = await db
    .select({ id: articles.id })
    .from(articles)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(asc(articles.id))
    .limit(options.limit);

  return rows.map((row) => row.id);
}

export async function countArticleSearchDocuments(db: Database): Promise<number> {
  const [result] = await db.select({ value: count(articles.id) }).from(articles);

  return result?.value ?? 0;
}

export async function countPendingArticleSearchEntries(db: Database): Promise<number> {
  const [result] = await db
    .select({ value: count(articleSearchOutbox.articleId) })
    .from(articleSearchOutbox)
    .where(lte(articleSearchOutbox.availableAt, new Date()));

  return result?.value ?? 0;
}

export async function getPendingArticleSearchEntries(
  db: Database,
  limit: number,
): Promise<ArticleSearchOutboxEntry[]> {
  return db
    .select()
    .from(articleSearchOutbox)
    .where(lte(articleSearchOutbox.availableAt, new Date()))
    .orderBy(asc(articleSearchOutbox.availableAt), asc(articleSearchOutbox.articleId))
    .limit(limit);
}

export async function clearArticleSearchEntries(
  db: Database,
  articleIds: readonly string[],
  synchronizedBefore: Date,
): Promise<void> {
  if (articleIds.length === 0) {
    return;
  }

  await db
    .delete(articleSearchOutbox)
    .where(
      and(
        inArray(articleSearchOutbox.articleId, [...articleIds]),
        lte(articleSearchOutbox.updatedAt, synchronizedBefore),
      ),
    );
}

export async function getArticleSearchSynchronizationWatermark(db: Database): Promise<Date> {
  const result = await db.execute<{ value: Date | string }>(sql`SELECT now() AS value`);
  const rawWatermark = result.rows[0]?.value;
  const watermark = rawWatermark instanceof Date ? rawWatermark : new Date(rawWatermark ?? "");

  if (Number.isNaN(watermark.getTime())) {
    throw new Error("Could not establish a search synchronization watermark");
  }

  return watermark;
}

export async function failArticleSearchEntries(
  db: Database,
  articleIds: readonly string[],
  error: unknown,
  failedBefore: Date,
): Promise<void> {
  if (articleIds.length === 0) {
    return;
  }

  const message = error instanceof Error ? error.message : String(error);

  await db
    .update(articleSearchOutbox)
    .set({
      attempts: sql`${articleSearchOutbox.attempts} + 1`,
      availableAt: sql`now() + make_interval(secs => LEAST(3600, POWER(2, LEAST(${articleSearchOutbox.attempts}, 12))::int))`,
      lastError: message.slice(0, 2_000),
      updatedAt: new Date(),
    })
    .where(
      and(
        inArray(articleSearchOutbox.articleId, [...articleIds]),
        lte(articleSearchOutbox.updatedAt, failedBefore),
      ),
    );
}

export async function markArticleSearchDirty(
  db: SearchOutboxDatabase,
  articleIds: readonly string[],
  operation: "delete" | "upsert" = "upsert",
): Promise<void> {
  if (articleIds.length === 0) {
    return;
  }

  await db.execute(sql`
    INSERT INTO ${articleSearchOutbox} (article_id, operation)
    SELECT article_id, ${operation}
    FROM UNNEST(${[...articleIds]}::uuid[]) AS dirty(article_id)
    ON CONFLICT (article_id) DO UPDATE SET
      operation = EXCLUDED.operation,
      attempts = 0,
      available_at = now(),
      last_error = NULL,
      updated_at = now()
  `);
}

export async function markSourceArticleSearchDirty(
  db: SearchOutboxDatabase,
  sourceId: string,
  operation: "delete" | "upsert" = "upsert",
): Promise<void> {
  await db.execute(sql`
    INSERT INTO ${articleSearchOutbox} (article_id, operation)
    SELECT ${articles.id}, ${operation}
    FROM ${articles}
    WHERE ${articles.sourceId} = ${sourceId}
    ON CONFLICT (article_id) DO UPDATE SET
      operation = EXCLUDED.operation,
      attempts = 0,
      available_at = now(),
      last_error = NULL,
      updated_at = now()
  `);
}

export async function markCategoryArticleSearchDirty(
  db: SearchOutboxDatabase,
  categoryId: string,
): Promise<void> {
  await db.execute(sql`
    INSERT INTO ${articleSearchOutbox} (article_id, operation)
    SELECT ${articles.id}, 'upsert'
    FROM ${articles}
    WHERE ${articles.categoryId} = ${categoryId}
    ON CONFLICT (article_id) DO UPDATE SET
      operation = EXCLUDED.operation,
      attempts = 0,
      available_at = now(),
      last_error = NULL,
      updated_at = now()
  `);
}

function searchDocumentQuery(db: Database) {
  return db
    .select(searchDocumentSelection)
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(sources, eq(articles.sourceId, sources.id));
}

function mapSearchDocument(row: SearchDocumentRow): SearchDocument {
  return {
    ...row,
    categories: row.categories ?? [],
    publishedAt: row.publishedAt.toISOString(),
    publishedAtTimestamp: Math.floor(row.publishedAt.getTime() / 1_000),
  };
}
