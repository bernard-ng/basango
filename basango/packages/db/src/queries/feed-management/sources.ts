import type { SQL } from "drizzle-orm";
import { and, desc, eq, lt, or, sql } from "drizzle-orm";

import type { Database } from "@db/client";
import { articles, followedSources, sources } from "@db/schema";
import {
  buildPaginationResult,
  createPageState,
  decodeCursor,
  type PageRequest,
  type PaginationMeta,
  type PageState,
} from "@db/utils/pagination";

const SOURCE_IMAGE_BASE = "https://devscast.org/images/sources/";
const PUBLICATION_GRAPH_DAYS = 180;

export interface SourceOverviewRow {
  source_id: string;
  source_display_name: string | null;
  source_image: string;
  source_url: string;
  source_name: string;
  source_created_at: string;
  source_is_followed: boolean;
}

export interface SourceOverviewResult {
  data: SourceOverviewRow[];
  pagination: PaginationMeta;
}

export interface PublicationEntry {
  day: string;
  count: number;
}

export interface CategoryShare {
  category: string;
  count: number;
  percentage: number;
}

export interface SourceDetailsResult {
  source: {
    source_id: string;
    source_name: string;
    source_description: string | null;
    source_url: string;
    source_updated_at: string | null;
    source_display_name: string | null;
    source_bias: string;
    source_reliability: string;
    source_transparency: string;
    source_image: string;
    articles_count: number;
    source_crawled_at: string | null;
    articles_metadata_available: number;
    source_is_followed: boolean;
  };
  publicationGraph: PublicationEntry[];
  categoryShares: CategoryShare[];
}

function buildFollowExistsExpression(userId: string): SQL<boolean> {
  return sql`EXISTS (
    SELECT 1
    FROM ${followedSources} f
    WHERE f.source_id = ${sources.id} AND f.follower_id = ${userId}
  )`;
}

export async function getSourceOverviewList(
  db: Database,
  params: { userId: string; page?: PageRequest },
): Promise<SourceOverviewResult> {
  const page = createPageState(params.page);
  const followExpression = buildFollowExistsExpression(params.userId);

  let query = db
    .select({
      source_id: sources.id,
      source_display_name: sources.displayName,
      source_image: sql<string>`('${SOURCE_IMAGE_BASE}' || ${sources.name} || '.png')`,
      source_url: sources.url,
      source_name: sources.name,
      source_created_at: sources.createdAt,
      source_is_followed: followExpression,
    })
    .from(sources);

  const cursor = decodeCursor(page.cursor);
  if (cursor?.date) {
    query = query.where(
      or(
        lt(sources.createdAt, cursor.date),
        and(eq(sources.createdAt, cursor.date), lt(sources.id, cursor.id)),
      ),
    );
  }

  const rows = await query
    .orderBy(desc(sources.createdAt), desc(sources.id))
    .limit(page.limit + 1);

  return buildPaginationResult(rows, page, {
    id: "source_id",
    date: "source_created_at",
  });
}

function createBackwardDateRange(days: number): { start: number; end: number } {
  const now = new Date();
  const end = Math.floor((now.getTime() + 86_400_000) / 1000);
  const startDate = new Date(now.getTime() - days * 86_400_000);
  const start = Math.floor(startDate.getTime() / 1000);

  return { start, end };
}

async function fetchPublicationGraph(
  db: Database,
  sourceId: string,
): Promise<PublicationEntry[]> {
  const range = createBackwardDateRange(PUBLICATION_GRAPH_DAYS);

  const rows = await db
    .select({
      day: sql<string>`date(${articles.publishedAt})`,
      count: sql<number>`count(${articles.id})`,
    })
    .from(articles)
    .where(eq(articles.sourceId, sourceId))
    .where(
      sql`${articles.publishedAt} BETWEEN to_timestamp(${range.start}) AND to_timestamp(${range.end})`,
    )
    .groupBy(sql`date(${articles.publishedAt})`)
    .orderBy(sql`date(${articles.publishedAt})`);

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.day, Number(row.count ?? 0));
  }

  const entries: PublicationEntry[] = [];
  const start = new Date(range.start * 1000);
  const end = new Date(range.end * 1000);

  for (
    let date = new Date(start.getTime());
    date < end;
    date.setUTCDate(date.getUTCDate() + 1)
  ) {
    const day = date.toISOString().slice(0, 10);
    entries.push({ day, count: counts.get(day) ?? 0 });
  }

  return entries;
}

async function fetchCategoryShares(
  db: Database,
  sourceId: string,
): Promise<CategoryShare[]> {
  const rows = await db
    .select({
      categories: sql<string | null>`array_to_string(${articles.categories}, ',')`,
    })
    .from(articles)
    .where(eq(articles.sourceId, sourceId));

  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.categories) continue;
    for (const category of row.categories.split(",")) {
      const normalized = category.trim();
      if (normalized.length === 0) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  const total = Array.from(counts.values()).reduce((acc, value) => acc + value, 0);

  const shares: CategoryShare[] = Array.from(counts.entries()).map(
    ([category, count]) => ({
      category,
      count,
      percentage: total > 0 ? Math.round((count / total) * 10000) / 100 : 0,
    }),
  );

  shares.sort((a, b) => b.count - a.count);
  return shares;
}

export async function getSourceDetails(
  db: Database,
  params: { sourceId: string; userId: string },
): Promise<SourceDetailsResult | null> {
  const followExpression = buildFollowExistsExpression(params.userId);

  const [row] = await db
    .select({
      source_id: sources.id,
      source_name: sources.name,
      source_description: sources.description,
      source_url: sources.url,
      source_updated_at: sources.updatedAt,
      source_display_name: sources.displayName,
      source_bias: sources.bias,
      source_reliability: sources.reliability,
      source_transparency: sources.transparency,
      source_image: sql<string>`('${SOURCE_IMAGE_BASE}' || ${sources.name} || '.png')`,
      articles_count: sql<number>`count(${articles.id})`,
      source_crawled_at: sql<string | null>`max(${articles.crawledAt})`,
      articles_metadata_available: sql<number>`count(*) FILTER (WHERE ${articles.metadata} IS NOT NULL)`,
      source_is_followed: followExpression,
    })
    .from(sources)
    .leftJoin(articles, eq(articles.sourceId, sources.id))
    .where(eq(sources.id, params.sourceId))
    .groupBy(
      sources.id,
      sources.name,
      sources.description,
      sources.url,
      sources.updatedAt,
      sources.displayName,
      sources.bias,
      sources.reliability,
      sources.transparency,
    )
    .limit(1);

  if (!row) {
    return null;
  }

  const [publicationGraph, categoryShares] = await Promise.all([
    fetchPublicationGraph(db, params.sourceId),
    fetchCategoryShares(db, params.sourceId),
  ]);

  return {
    source: {
      ...row,
      articles_count: Number(row.articles_count ?? 0),
      articles_metadata_available: Number(row.articles_metadata_available ?? 0),
    },
    publicationGraph,
    categoryShares,
  };
}
