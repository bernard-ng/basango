import { and, eq, sql } from "drizzle-orm";

import type { Database } from "@db/client";
import { articles, sources } from "@db/schema";

export interface SourceStatisticsRow {
  sourceId: string;
  sourceName: string;
  sourceCrawledAt: string | null;
  articlesCount: number;
  articleMetadataAvailable: number;
}

export async function getSourceStatisticsList(
  db: Database,
): Promise<SourceStatisticsRow[]> {
  const rows = await db
    .select({
      sourceId: sources.id,
      sourceName: sources.name,
      sourceCrawledAt: sql<string | null>`max(${articles.crawledAt})`,
      articlesCount: sql<number>`count(${articles.id})`,
      articleMetadataAvailable: sql<number>`sum(CASE WHEN ${articles.metadata} IS NOT NULL THEN 1 ELSE 0 END)`,
    })
    .from(sources)
    .leftJoin(articles, eq(articles.sourceId, sources.id))
    .groupBy(sources.id, sources.name)
    .orderBy(sources.name.asc());

  return rows.map((row) => ({
    sourceId: row.sourceId,
    sourceName: row.sourceName,
    sourceCrawledAt: row.sourceCrawledAt,
    articlesCount: Number(row.articlesCount ?? 0),
    articleMetadataAvailable: Number(row.articleMetadataAvailable ?? 0),
  }));
}

export interface PublicationDateParams {
  source: string;
  category?: string | null;
}

async function selectPublicationBoundary(
  db: Database,
  fn: "min" | "max",
  params: PublicationDateParams,
): Promise<string> {
  const conditions = [eq(sources.name, params.source)];

  if (params.category) {
    conditions.push(
      sql`${params.category} = ANY(${articles.categories})`,
    );
  }

  const whereClause = conditions.length > 1
    ? and(...conditions)
    : conditions[0];

  const [result] = await db
    .select({
      boundary:
        fn === "min"
          ? sql<string | null>`min(${articles.publishedAt})`
          : sql<string | null>`max(${articles.publishedAt})`,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(whereClause);

  return result?.boundary ?? new Date().toISOString();
}

export async function getEarliestPublicationDate(
  db: Database,
  params: PublicationDateParams,
): Promise<string> {
  return selectPublicationBoundary(db, "min", params);
}

export async function getLatestPublicationDate(
  db: Database,
  params: PublicationDateParams,
): Promise<string> {
  return selectPublicationBoundary(db, "max", params);
}
