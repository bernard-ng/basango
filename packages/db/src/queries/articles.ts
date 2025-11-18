import { DEFAULT_TIMEZONE } from "@basango/domain/constants";
import {
  Article,
  Distribution,
  Distributions,
  ID,
  PaginationState,
  Publication,
  Publications,
  Sentiment,
} from "@basango/domain/models";
import { md5 } from "@basango/encryption";
import type { SQL } from "drizzle-orm";
import { count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import { v7 as uuidV7 } from "uuid";

import { Database } from "#db/client";
import { getSourceIdByName } from "#db/queries/sources";
import { articles, sources } from "#db/schema";
import { CreateArticleParams, GetArticlesParams } from "#db/types/articles";
import { GetDistributionsParams, GetPublicationsParams } from "#db/types/shared";
import {
  applyFilters,
  buildDateRange,
  buildKeysetFilter,
  buildPaginatedResult,
  buildPaginationState,
  buildPreviousRange,
  buildSearchQuery,
  computeDelta,
  computeReadingTime,
  computeTokenStatistics,
} from "#db/utils";

export async function createArticle(db: Database, params: CreateArticleParams) {
  const duplicated = await getArticleByHash(db, md5(params.link));
  if (duplicated !== undefined) {
    return {
      id: duplicated.id,
      sourceId: duplicated.sourceId,
    };
  }

  const data = {
    ...params,
    hash: md5(params.link),
    readingTime: computeReadingTime(params.body),
    sentiment: "neutral" as Sentiment,
    sourceId: await getSourceIdByName(db, params.sourceId),
    tokenStatistics: computeTokenStatistics({
      body: params.body,
      categories: params.categories,
      title: params.title,
    }),
  };

  const [result] = await db
    .insert(articles)
    .values({ id: uuidV7(), ...data })
    .returning({
      id: articles.id,
      sourceId: articles.sourceId,
    });

  if (result === undefined) {
    throw new Error("Failed to create article");
  }

  return result;
}

export async function getArticleByHash(db: Database, hash: string) {
  return await db.query.articles.findFirst({
    where: eq(articles.hash, hash),
  });
}

export async function getArticleById(db: Database, id: ID) {
  return await db.query.articles.findFirst({
    where: eq(articles.id, id),
  });
}

export async function countArticlesBySourceId(db: Database, sourceId: ID) {
  const result = await db
    .select({ count: count(articles.id) })
    .from(articles)
    .where(eq(articles.sourceId, sourceId))
    .then((res) => res[0]);

  return result?.count ?? 0;
}

function buildFilters(params: GetArticlesParams, pagination: PaginationState) {
  const filters: SQL<unknown>[] = [];

  if (params.sourceId) {
    filters.push(eq(articles.sourceId, params.sourceId));
  }

  if (params.sentiment) {
    filters.push(eq(articles.sentiment, params.sentiment as Sentiment));
  }

  if (params.category) {
    filters.push(sql`${params.category} = ANY(${articles.categories})`);
  }

  if (params.search?.trim()) {
    const query = buildSearchQuery(params.search);
    if (query) {
      filters.push(sql`${articles.tsv} @@ to_tsquery('french', ${query})`);
    }
  }

  const cursorFilter = buildKeysetFilter({
    cursor: pagination.payload,
    date: articles.publishedAt,
    id: articles.id,
  });

  if (cursorFilter !== undefined) {
    filters.push(cursorFilter);
  }

  return filters;
}

export async function getArticles(db: Database, params: GetArticlesParams) {
  const pagination = buildPaginationState(params);
  const filters = buildFilters(params, pagination);

  const query = db
    .select({
      ...getTableColumns(articles),
      source: {
        ...getTableColumns(sources),
      },
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id));

  const rows = await applyFilters(query, filters)
    .orderBy(desc(articles.publishedAt), desc(articles.id))
    .limit(pagination.limit + 1);

  return buildPaginatedResult<Article>(rows, pagination, {
    date: "publishedAt",
    id: "id",
  });
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
