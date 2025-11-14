import { endOfDay, startOfDay, subDays } from "date-fns";
import { eq, sql } from "drizzle-orm";
import { v7 as uuidV7 } from "uuid";

import { Database } from "#db/client";
import { CATEGORY_SHARES_LIMIT, PUBLICATION_GRAPH_DAYS, TIMEZONE } from "#db/constants";
import { NotFoundError } from "#db/errors";
import { Credibility, articles, sources } from "#db/schema";

import { countArticlesBySourceId } from "./articles";

export async function getSources(db: Database) {
  const rows = await db.query.sources.findMany();

  return await Promise.all(
    rows.map(async (row) => ({
      ...row,
      articles: await countArticlesBySourceId(db, row.id),
      publicationGraph: await getSourcePublicationGraph(db, row.id),
    })),
  );
}

export type CreateSourceParams = {
  name: string;
  url: string;
  displayName?: string;
  description?: string;
  credibility?: Credibility;
};

export async function createSource(db: Database, params: CreateSourceParams) {
  const [result] = await db
    .insert(sources)
    .values({ id: uuidV7(), ...params })
    .returning();

  return result;
}

export type UpdateSourceParams = {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  credibility?: Credibility;
};

export async function updateSource(db: Database, params: UpdateSourceParams) {
  const [result] = await db
    .update(sources)
    .set({
      credibility: params.credibility,
      description: params.description,
      displayName: params.displayName,
      name: params.name,
    })
    .where(eq(sources.id, params.id))
    .returning();

  if (result === undefined) {
    throw new NotFoundError(`Source not found`);
  }

  return result;
}

export type DeleteSourceParams = {
  id: string;
};

export async function deleteSource(db: Database, params: DeleteSourceParams) {
  const [result] = await db.delete(sources).where(eq(sources.id, params.id)).returning();

  return result;
}

export async function getSourceByName(db: Database, name: string) {
  return await db.query.sources.findFirst({
    where: eq(sources.name, name),
  });
}

export async function getSourceById(db: Database, id: string) {
  const item = await db.query.sources.findFirst({
    where: eq(sources.id, id),
  });

  if (item === undefined) {
    throw new NotFoundError("Source not found");
  }

  return item;
}

export async function getSourceIdByName(db: Database, name: string): Promise<string> {
  const result = await db.query.sources.findFirst({
    columns: {
      id: true,
    },
    where: eq(sources.name, name),
  });

  if (!result) {
    throw new NotFoundError("Source not found");
  }

  return result.id;
}

export type GetSourceByIdParams = {
  id: string;
};

export type PublicationEntry = {
  date: string;
  count: number;
};

export type PublicationGraph = {
  items: PublicationEntry[];
  total: number;
};

export type CategoryShare = {
  category: string;
  count: number;
  percentage: number;
};

export type CategoryShares = {
  items: CategoryShare[];
  total: number;
};

export async function getSourcePublicationGraph(
  db: Database,
  id: string,
  days: number = PUBLICATION_GRAPH_DAYS,
): Promise<PublicationGraph> {
  const endDate = endOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, days - 1));

  const data = await db.execute<PublicationEntry>(sql`
    WITH bounds AS (
      SELECT
        ${startDate}::timestamptz AS start_ts,
        ${endDate}::timestamptz   AS end_ts
    ),
    series AS (
      SELECT (gs)::date AS d
      FROM bounds b,
      LATERAL generate_series(
        date_trunc('day', timezone(${TIMEZONE}, b.start_ts)),
        date_trunc('day', timezone(${TIMEZONE}, b.end_ts)),
        INTERVAL '1 day'
      ) AS gs
    ),
    counts AS (
      SELECT
        a.published_at::date AS d,
        COUNT(*)::int        AS c
      FROM article a, bounds b
      WHERE a.source_id = ${id}::uuid
        AND a.published_at >= timezone(${TIMEZONE}, b.start_ts)
        AND a.published_at <= timezone(${TIMEZONE}, b.end_ts)
      GROUP BY 1
    )
    SELECT
      to_char(s.d, 'YYYY-MM-DD') AS date,
      COALESCE(c.c, 0)           AS count
    FROM series s
    LEFT JOIN counts c USING (d)
    ORDER BY s.d ASC
  `);

  return { items: data.rows, total: data.rows.length };
}

export async function getSourceCategoryShares(db: Database, id: string): Promise<CategoryShares> {
  const data = await db.execute<CategoryShare>(sql`
    SELECT
      cat AS category,
      COUNT(*)::int AS count,
      ROUND((COUNT(*)::numeric / SUM(COUNT(*)) OVER ()) * 100, 2) AS percentage
    FROM (
      SELECT NULLIF(BTRIM(c), '') AS cat
      FROM ${articles}
      CROSS JOIN LATERAL UNNEST(COALESCE(${articles.categories}, ARRAY[]::text[])) AS c
      WHERE ${articles.sourceId} = ${id}
    ) t
    WHERE cat IS NOT NULL
    GROUP BY cat
    ORDER BY count DESC
    LIMIT ${CATEGORY_SHARES_LIMIT}
  `);

  return { items: data.rows, total: data.rowCount ?? 0 };
}
