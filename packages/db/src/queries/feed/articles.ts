import type { ReaderArticleList } from "@basango/domain/models";
import { type SQL, count, desc, eq, sql } from "drizzle-orm";

import type { Database } from "#db/client";
import { NotFoundError } from "#db/errors";
import { articles, categories, sources } from "#db/schema";
import {
  applyFilters,
  buildPaginatedResult,
  buildPaginationState,
  buildSearchQuery,
} from "#db/utils";

export const readerArticleOverviewSelection = {
  categories: articles.categories,
  category: {
    id: categories.id,
    name: categories.name,
    slug: categories.slug,
  },
  excerpt: articles.excerpt,
  id: articles.id,
  image: articles.image,
  publishedAt: articles.publishedAt,
  readingTime: articles.readingTime,
  source: {
    displayName: sources.displayName,
    id: sources.id,
    name: sources.name,
    url: sources.url,
  },
  title: articles.title,
} as const;

export async function getReaderArticles(db: Database, params: ReaderArticleList) {
  const pagination = buildPaginationState(params);
  const filters = buildReaderArticleFilters(params);

  const query = db
    .select(readerArticleOverviewSelection)
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

  return buildPaginatedResult(rows, pagination, total);
}

export async function getReaderArticleById(db: Database, id: string) {
  const [item] = await db
    .select({
      ...readerArticleOverviewSelection,
      body: articles.body,
      link: articles.link,
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

function buildReaderArticleFilters(params: ReaderArticleList): SQL<unknown>[] {
  const filters: SQL<unknown>[] = [];

  if (params.sourceId) {
    filters.push(eq(articles.sourceId, params.sourceId));
  }

  if (params.categoryId) {
    filters.push(eq(articles.categoryId, params.categoryId));
  }

  if (params.search) {
    const query = buildSearchQuery(params.search);

    if (query) {
      filters.push(sql`${articles.tsv} @@ to_tsquery('french', ${query})`);
    }
  }

  return filters;
}
