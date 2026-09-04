import type { ArticleList } from "@basango/domain/models/public";
import { type SQL, count, desc, eq, gte, lte } from "drizzle-orm";

import type { Database } from "#db/client";
import { NotFoundError } from "#db/errors";
import { articles, categories, sources } from "#db/schema";
import { applyFilters, buildPaginatedResult, buildPaginationState } from "#db/utils";

export const articleOverviewSelection = {
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

export async function getArticles(db: Database, params: ArticleList) {
  const pagination = buildPaginationState(params);
  const filters = buildArticleFilters(params);

  const query = db
    .select(articleOverviewSelection)
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

export async function getArticleById(db: Database, id: string) {
  const [item] = await db
    .select({
      ...articleOverviewSelection,
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

function buildArticleFilters(params: ArticleList): SQL<unknown>[] {
  const filters: SQL<unknown>[] = [];

  if (params.sourceId) {
    filters.push(eq(articles.sourceId, params.sourceId));
  }

  if (params.categoryId) {
    filters.push(eq(articles.categoryId, params.categoryId));
  }

  if (params.publishedAfter) {
    filters.push(gte(articles.publishedAt, params.publishedAfter));
  }

  if (params.publishedBefore) {
    filters.push(lte(articles.publishedAt, params.publishedBefore));
  }

  return filters;
}
