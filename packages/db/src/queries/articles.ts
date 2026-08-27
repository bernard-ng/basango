import { DEFAULT_TIMEZONE } from "@basango/domain/constants";
import {
  Article,
  Distribution,
  Distributions,
  ID,
  Publication,
  Publications,
  Sentiment,
} from "@basango/domain/models";
import { md5 } from "@basango/encryption";
import type { SQL } from "drizzle-orm";
import { count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import * as uuid from "uuid";

import { Database } from "#db/client";
import { NotFoundError } from "#db/errors";
import { getOrCreateSourceIdByName } from "#db/queries/sources";
import { articles, categories, sources } from "#db/schema";
import { classifyCategory, ensureCanonicalCategory } from "#db/services/category-classifier";
import { CreateArticleParams, GetArticlesParams } from "#db/types/articles";
import { GetDistributionsParams, GetPublicationsParams } from "#db/types/shared";
import {
  applyFilters,
  buildDateRange,
  buildPaginatedResult,
  buildPaginationState,
  buildPreviousRange,
  buildSearchQuery,
  computeDelta,
  computeReadingTime,
  computeTokenStatistics,
} from "#db/utils";

export async function createArticle(db: Database, params: CreateArticleParams) {
  const hash = md5(params.link);
  const data = {
    ...params,
    categories: params.categories ?? [],
    hash,
    id: uuid.v7(),
    readingTime: computeReadingTime(params.body),
    sentiment: (params.sentiment ?? "neutral") as Sentiment,
    sourceId: await getOrCreateSourceIdByName(db, params.sourceId, new URL(params.link).origin),
    tokenStatistics: computeTokenStatistics({
      body: params.body,
      categories: params.categories ?? [],
      title: params.title,
    }),
  };

  const category = await ensureCanonicalCategory(db, classifyCategory(data).category);
  data.categoryId = category.id;

  const [result] = await db
    .insert(articles)
    .values({ ...data })
    .onConflictDoNothing({ target: articles.hash })
    .returning({
      id: articles.id,
      sourceId: articles.sourceId,
    });

  if (result !== undefined) {
    return { ...result, created: true };
  }

  const duplicated = await getArticleByHash(db, hash);
  if (duplicated === undefined) {
    throw new Error("Failed to resolve article after an idempotent insert conflict");
  }

  return {
    created: false,
    id: duplicated.id,
    sourceId: duplicated.sourceId,
  };
}

export async function getArticleByHash(db: Database, hash: string) {
  return await db.query.articles.findFirst({
    where: eq(articles.hash, hash),
  });
}

export async function getArticleById(db: Database, id: ID) {
  const [item] = await db
    .select({
      ...getTableColumns(articles),
      category: {
        ...getTableColumns(categories),
      },
      source: {
        ...getTableColumns(sources),
      },
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(articles.id, id))
    .limit(1);

  if (item === undefined) {
    throw new NotFoundError("Article not found");
  }

  return item;
}

function buildFilters(params: GetArticlesParams) {
  const filters: SQL<unknown>[] = [];

  if (params.sourceId) {
    filters.push(eq(articles.sourceId, params.sourceId));
  }

  if (params.sentiment) {
    filters.push(eq(articles.sentiment, params.sentiment as Sentiment));
  }

  if (params.category) {
    filters.push(eq(articles.categoryId, params.category));
  }

  if (params.search?.trim()) {
    const query = buildSearchQuery(params.search);
    if (query) {
      filters.push(sql`${articles.tsv} @@ to_tsquery('french', ${query})`);
    }
  }

  return filters;
}

export async function getArticles(db: Database, params: GetArticlesParams) {
  const pagination = buildPaginationState(params);
  const filters = buildFilters(params);

  const query = db
    .select({
      ...getTableColumns(articles),
      category: {
        ...getTableColumns(categories),
      },
      source: {
        ...getTableColumns(sources),
      },
    })
    .from(articles)
    .leftJoin(categories, eq(articles.categoryId, categories.id))
    .innerJoin(sources, eq(articles.sourceId, sources.id));

  const [rows, total] = await Promise.all([
    applyFilters(query, filters)
      .orderBy(desc(articles.publishedAt), desc(articles.id))
      .limit(pagination.limit)
      .offset(pagination.offset),
    applyFilters(db.select({ value: count(articles.id) }).from(articles), filters).then(
      (result: { value: number }[]) => result[0]?.value ?? 0,
    ),
  ]);

  return buildPaginatedResult<Article>(rows, pagination, total);
}

export async function getArticlesPublicationGraph(
  db: Database,
  params: GetPublicationsParams,
): Promise<Publications> {
  const current = buildDateRange(params.range);
  const previous = buildPreviousRange(current);

  const data = await db.execute<Publication>(sql`
    WITH bounds AS (
      SELECT
        ${current.start}::timestamptz AS start_ts,
        ${current.end}::timestamptz AS end_ts
    ),
    series AS (
      SELECT (gs)::date AS d
      FROM bounds b,
      LATERAL generate_series(
        date_trunc('day', timezone(${DEFAULT_TIMEZONE}, b.start_ts)),
        date_trunc('day', timezone(${DEFAULT_TIMEZONE}, b.end_ts)),
        INTERVAL '1 day'
      ) AS gs
    ),
    counts AS (
      SELECT
        a.published_at::date AS d,
        COUNT(*)::int AS c
      FROM article a, bounds b
      WHERE a.published_at >= timezone(${DEFAULT_TIMEZONE}, b.start_ts)
        AND a.published_at <= timezone(${DEFAULT_TIMEZONE}, b.end_ts)
      GROUP BY 1
    )
    SELECT
      to_char(s.d, 'YYYY-MM-DD') AS date,
      COALESCE(c.c, 0) AS count
    FROM series s
    LEFT JOIN counts c USING (d)
    ORDER BY s.d ASC
  `);

  const [previousResult] = await db
    .execute<{ count: number }>(
      sql`
      SELECT COALESCE(COUNT(*)::int, 0) AS count
      FROM article a
      WHERE a.published_at >= timezone(${DEFAULT_TIMEZONE}, ${previous.start})
        AND a.published_at <= timezone(${DEFAULT_TIMEZONE}, ${previous.end})
    `,
    )
    .then((res) => res.rows);

  const currentTotal = data.rows.reduce((acc, item) => acc + item.count, 0);
  const previousTotal = previousResult?.count ?? 0;

  return {
    items: data.rows,
    meta: {
      current: currentTotal,
      delta: computeDelta(currentTotal, previousTotal),
      previous: previousTotal,
    },
  };
}

export async function getArticlesSourceDistribution(
  db: Database,
  params: GetDistributionsParams,
): Promise<Distributions> {
  const data = await db.execute<Distribution>(sql`
    SELECT
      ${sources.id}::text AS id,
      ${sources.name} AS name,
      COUNT(${articles.id})::int AS count,
      ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 2)::float AS percentage
    FROM ${articles}
    JOIN ${sources} ON ${sources.id} = ${articles.sourceId}
    GROUP BY ${sources.id}, ${sources.name}
    ORDER BY count DESC
    LIMIT ${params.limit ?? 10}
  `);

  return {
    items: data.rows,
    total: data.rows.reduce((acc, item) => acc + item.count, 0),
  };
}
