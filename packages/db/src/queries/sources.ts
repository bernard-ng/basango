import { DEFAULT_TIMEZONE } from "@basango/domain/constants";
import type {
  GetSourcePublicationBounds,
  ID,
  Publication,
  Publications,
  SourcePublicationBounds,
} from "@basango/domain/models";
import { calculateSourceCoveragePercent } from "@basango/domain/models";
import {
  and,
  arrayContains,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  max,
  min,
  or,
  sql,
} from "drizzle-orm";
import * as uuid from "uuid";

import type { Database } from "#db/client";
import { NotFoundError } from "#db/errors";
import { markSourceArticleSearchDirty } from "#db/queries/search-documents";
import { articles, categories, sources } from "#db/schema";
import type {
  CategoryDistribution,
  CategoryDistributionItem,
  CategoryDistributionRow,
  GetCategoryDistributionParams,
  GetPublicationsParams,
} from "#db/types/shared";
import type {
  CreateSourceParams,
  GetSourcesParams,
  SyncCrawlerSourcesParams,
  UpdateSourceParams,
} from "#db/types/sources";
import { buildDateRange, buildPaginatedResult, buildPaginationState } from "#db/utils";

export async function getSources(db: Database, params: GetSourcesParams) {
  const pagination = buildPaginationState(params);
  const [rows, total] = await Promise.all([
    db
      .select({
        ...getTableColumns(sources),
        articles: count(articles.id),
      })
      .from(sources)
      .leftJoin(articles, eq(articles.sourceId, sources.id))
      .groupBy(sources.id)
      .orderBy(desc(count(articles.id)), asc(sources.name), asc(sources.id))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db
      .select({ value: count(sources.id) })
      .from(sources)
      .then((result) => result[0]?.value ?? 0),
  ]);

  const items = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      coveragePercent: calculateSourceCoveragePercent(row.articles, row.estimatedArticles),
      publications: await getSourcePublicationGraph(db, { id: row.id }),
    })),
  );

  return buildPaginatedResult(items, pagination, total);
}

export async function createSource(db: Database, params: CreateSourceParams) {
  const [result] = await db
    .insert(sources)
    .values({ id: uuid.v7(), ...params })
    .returning();

  return result;
}

export async function syncCrawlerSources(db: Database, params: SyncCrawlerSourcesParams) {
  const synchronizedAt = new Date();

  return db.transaction(async (tx) => {
    let created = 0;
    let updated = 0;

    for (const source of params.sources) {
      const [existing] = await tx
        .select()
        .from(sources)
        .where(
          or(
            sql`lower(${sources.name}) = lower(${source.name})`,
            sql`lower(${sources.url}) = lower(${source.url})`,
          ),
        )
        .limit(1);

      if (existing) {
        await tx
          .update(sources)
          .set({
            coverageUpdatedAt:
              source.estimatedArticles === undefined ? existing.coverageUpdatedAt : synchronizedAt,
            estimatedArticles: source.estimatedArticles ?? existing.estimatedArticles,
            name: source.name,
            updatedAt: synchronizedAt,
            url: source.url,
          })
          .where(eq(sources.id, existing.id));
        await markSourceArticleSearchDirty(tx, existing.id);
        updated += 1;
        continue;
      }

      const [inserted] = await tx
        .insert(sources)
        .values({
          coverageUpdatedAt: source.estimatedArticles === undefined ? undefined : synchronizedAt,
          estimatedArticles: source.estimatedArticles,
          id: uuid.v7(),
          name: source.name,
          url: source.url,
        })
        .onConflictDoNothing()
        .returning({ id: sources.id });

      if (inserted) {
        created += 1;
        continue;
      }

      const [raced] = await tx
        .select()
        .from(sources)
        .where(
          or(
            sql`lower(${sources.name}) = lower(${source.name})`,
            sql`lower(${sources.url}) = lower(${source.url})`,
          ),
        )
        .limit(1);

      if (!raced) {
        throw new Error(`Could not synchronize crawler source '${source.name}'`);
      }

      await tx
        .update(sources)
        .set({
          coverageUpdatedAt:
            source.estimatedArticles === undefined ? raced.coverageUpdatedAt : synchronizedAt,
          estimatedArticles: source.estimatedArticles ?? raced.estimatedArticles,
          name: source.name,
          updatedAt: synchronizedAt,
          url: source.url,
        })
        .where(eq(sources.id, raced.id));
      await markSourceArticleSearchDirty(tx, raced.id);
      updated += 1;
    }

    return { created, updated };
  });
}

export async function updateSource(db: Database, params: UpdateSourceParams) {
  const result = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(sources)
      .set({
        credibility: params.credibility,
        description: params.description,
        displayName: params.displayName,
        name: params.name,
        updatedAt: new Date(),
        url: params.url,
      })
      .where(eq(sources.id, params.id))
      .returning();

    if (updated) {
      await markSourceArticleSearchDirty(tx, params.id);
    }

    return updated;
  });

  if (result === undefined) {
    throw new NotFoundError(`Source not found`);
  }

  return result;
}

export async function deleteSource(db: Database, id: ID) {
  const result = await db.transaction(async (tx) => {
    await markSourceArticleSearchDirty(tx, id, "delete");
    const [deleted] = await tx.delete(sources).where(eq(sources.id, id)).returning();

    return deleted;
  });

  return result;
}

export async function getSourceById(db: Database, id: ID) {
  const item = await db.query.sources.findFirst({
    where: eq(sources.id, id),
  });

  if (item === undefined) {
    throw new NotFoundError("Source not found");
  }

  return item;
}

export async function getOrCreateSourceIdByName(
  db: Database,
  name: string,
  url: string,
): Promise<string> {
  const existing = await db.query.sources.findFirst({
    columns: { id: true },
    where: eq(sources.name, name),
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(sources)
    .values({ id: uuid.v7(), name, url })
    .onConflictDoNothing()
    .returning({ id: sources.id });
  if (created) return created.id;

  // Another ingestion request may have inserted the source concurrently.
  const raced = await db.query.sources.findFirst({
    columns: { id: true },
    where: eq(sources.name, name),
  });
  if (!raced) {
    throw new Error(`Could not create crawler source '${name}' with URL '${url}'`);
  }
  return raced.id;
}

export async function getSourcePublicationGraph(
  db: Database,
  params: GetPublicationsParams,
): Promise<Publications> {
  const range = buildDateRange(params.range);

  const data = await db.execute<Publication>(sql`
    WITH bounds AS (
      SELECT
        ${range.start}::timestamptz AS start_ts,
        ${range.end}::timestamptz   AS end_ts
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
        COUNT(*)::int        AS c
      FROM article a, bounds b
      WHERE a.source_id = ${params.id}::uuid
        AND a.published_at >= timezone(${DEFAULT_TIMEZONE}, b.start_ts)
        AND a.published_at <= timezone(${DEFAULT_TIMEZONE}, b.end_ts)
      GROUP BY 1
    )
    SELECT
      to_char(s.d, 'YYYY-MM-DD') AS date,
      COALESCE(c.c, 0)           AS count
    FROM series s
    LEFT JOIN counts c USING (d)
    ORDER BY s.d ASC
  `);

  return { items: data.rows };
}

export async function getSourceCategoryDistribution(
  db: Database,
  params: GetCategoryDistributionParams,
): Promise<CategoryDistribution> {
  const data = await db.execute<CategoryDistributionRow>(sql`
    WITH source_articles AS (
      SELECT
        ${categories.id}::text AS "categoryId",
        ${categories.slug} AS slug,
        ${categories.name} AS category,
        ${articles.id} AS "articleId",
        ${articles.categories} AS "originalCategories",
        COUNT(*) OVER (PARTITION BY ${categories.id})::int AS "articleCount"
      FROM ${articles}
      JOIN ${categories} ON ${categories.id} = ${articles.categoryId}
      WHERE ${articles.sourceId} = ${params.id} AND ${articles.clustered} = true
    ),
    category_occurrences AS (
      SELECT
        source_articles."categoryId",
        source_articles.slug,
        source_articles.category,
        source_articles."articleCount",
        COALESCE(original_category.category, 'No original category') AS "originalCategory"
      FROM source_articles
      LEFT JOIN LATERAL (
        SELECT DISTINCT TRIM(raw_category) AS category
        FROM UNNEST(
          COALESCE(source_articles."originalCategories", ARRAY[]::text[])
        ) AS raw_category
        WHERE TRIM(raw_category) <> ''
      ) AS original_category ON true
    )
    SELECT
      "categoryId",
      slug,
      category,
      "articleCount",
      "originalCategory",
      COUNT(*)::int AS count
    FROM category_occurrences
    GROUP BY "categoryId", slug, category, "articleCount", "originalCategory"
    ORDER BY "articleCount" DESC, category ASC, count DESC, "originalCategory" ASC
  `);

  const itemsByCategory = new Map<string, CategoryDistributionItem>();

  for (const row of data.rows) {
    const item = itemsByCategory.get(row.categoryId) ?? {
      articleCount: row.articleCount,
      category: row.category,
      categoryId: row.categoryId,
      originalCategories: [],
      slug: row.slug,
    };

    item.originalCategories.push({
      category: row.originalCategory,
      count: row.count,
    });
    itemsByCategory.set(row.categoryId, item);
  }

  const items = Array.from(itemsByCategory.values());
  const total = items.reduce((sum, item) => sum + item.articleCount, 0);

  return { items, total };
}

export async function getSourcePublicationBounds(
  db: Database,
  params: GetSourcePublicationBounds,
): Promise<SourcePublicationBounds> {
  const conditions = [eq(sources.name, params.name)];

  if (params.category) {
    conditions.push(arrayContains(articles.categories, [params.category]));
  }

  const [bounds] = await db
    .select({
      earliest: min(articles.publishedAt),
      latest: max(articles.publishedAt),
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(and(...conditions));

  return bounds ?? { earliest: null, latest: null };
}
