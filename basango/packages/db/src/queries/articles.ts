import type { AnyColumn, SQL } from "drizzle-orm";
import { and, asc, desc, eq, gt, lt, or, sql } from "drizzle-orm";

import type { Database } from "@/client";
import {
  articles,
  bookmarkArticles,
  bookmarks,
  comments,
  sources,
  users,
} from "@/schema";
import {
  buildPaginationResult,
  createPageState,
  decodeCursor,
  type PageRequest,
  type PageState,
  type PaginationMeta,
  type SortDirection,
} from "@/utils/pagination";

export interface ArticleFilters {
  search?: string | null;
  category?: string | null;
  dateRange?: { start: number; end: number } | null;
  sortDirection?: SortDirection;
}

export interface ArticleOverviewRow {
  article_id: string;
  articleTitle: string;
  articleLink: string;
  articleCategories: string | null;
  article_excerpt: string | null;
  article_published_at: string;
  article_image: string | null;
  article_reading_time: number | null;
  sourceId: string;
  source_display_name: string | null;
  source_image: string;
  sourceUrl: string;
  source_name: string;
  source_created_at: string;
  article_is_bookmarked: boolean;
}

export interface ArticleOverviewResult {
  data: ArticleOverviewRow[];
  pagination: PaginationMeta;
}

export interface ArticleDetailsRow {
  article_id: string;
  articleTitle: string;
  articleLink: string;
  articleCategories: string | null;
  articleBody: string;
  article_hash: string;
  article_published_at: string;
  article_crawled_at: string;
  article_updated_at: string | null;
  article_bias: string;
  article_reliability: string;
  article_transparency: string;
  article_sentiment: string;
  article_metadata: unknown;
  article_reading_time: number | null;
  sourceId: string;
  source_name: string;
  source_description: string | null;
  sourceUrl: string;
  source_updated_at: string | null;
  source_display_name: string | null;
  source_bias: string;
  source_reliability: string;
  source_transparency: string;
  source_image: string;
  article_is_bookmarked: boolean;
}

export interface ArticleCommentRow {
  comment_id: string;
  comment_content: string;
  comment_sentiment: string;
  comment_created_at: string;
  user_id: string;
  user_name: string;
}

interface NormalizedArticleFilters {
  search?: string;
  category?: string;
  dateRange?: { start: number; end: number } | null;
  sortDirection: SortDirection;
}

export interface ArticleExportRow {
  articleId: string;
  articleTitle: string;
  articleLink: string;
  articleCategories: string | null;
  articleBody: string;
  articleSource: string;
  articleHash: string;
  articlePublishedAt: string;
  articleCrawledAt: string;
}

export interface ArticleExportParams {
  source?: string | null;
  dateRange?: { start: number; end: number } | null;
  batchSize?: number;
}

export async function* getArticlesForExport(
  db: Database,
  params: ArticleExportParams = {},
): AsyncGenerator<ArticleExportRow> {
  const batchSize =
    params.batchSize && params.batchSize > 0 ? params.batchSize : 1000;

  const filters: SQL[] = [];

  if (params.source) {
    filters.push(eq(sources.name, params.source));
  }

  if (params.dateRange) {
    filters.push(
      sql`${articles.publishedAt} BETWEEN to_timestamp(
      ${params.dateRange.start}
      )
      AND
      to_timestamp
      (
      ${params.dateRange.end}
      )`,
    );
  }

  let query = db
    .select({
      articleId: articles.id,
      articleTitle: articles.title,
      articleLink: articles.link,
      articleCategories: sql<string | null>`array_to_string
          (${articles.categories}, ',')`,
      articleBody: articles.body,
      articleSource: sources.name,
      articleHash: articles.hash,
      articlePublishedAt: articles.publishedAt,
      articleCrawledAt: articles.crawledAt,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id));

  if (filters.length === 1) {
    query = query.where(filters[0]);
  } else if (filters.length > 1) {
    query = query.where(and(...filters));
  }

  query = query.orderBy(desc(articles.publishedAt), desc(articles.id));

  let offset = 0;
  while (true) {
    const rows = await query.limit(batchSize).offset(offset);
    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      yield {
        ...row,
        articleCategories: row.articleCategories ?? null,
      };
    }

    offset += batchSize;
  }
}

const SOURCE_IMAGE_BASE = "https://devscast.org/images/sources/";

function normalizeArticleFilters(
  filters?: ArticleFilters,
): NormalizedArticleFilters {
  const trimmedSearch = filters?.search?.trim();
  const trimmedCategory = filters?.category?.trim();

  return {
    search:
      trimmedSearch && trimmedSearch.length > 0 ? trimmedSearch : undefined,
    category:
      trimmedCategory && trimmedCategory.length > 0
        ? trimmedCategory
        : undefined,
    dateRange: filters?.dateRange ?? null,
    sortDirection: filters?.sortDirection ?? "desc",
  };
}

function buildArticleFilterConditions(filters: NormalizedArticleFilters): {
  conditions: SQL[];
  searchQuery?: string;
} {
  const conditions: SQL[] = [];
  let searchQuery: string | undefined;

  if (filters.category) {
    conditions.push(sql`${filters.category} = ANY(
    ${articles.categories}
    )`);
  }

  if (filters.search) {
    const sanitized = filters.search.replace(/\s+/g, " & ");
    if (sanitized.length > 0) {
      searchQuery = sanitized;
      conditions.push(
        sql`${articles.tsv} @@ to_tsquery('french',
        ${sanitized}
        )`,
      );
    }
  }

  if (filters.dateRange) {
    conditions.push(
      sql`${articles.publishedAt} BETWEEN to_timestamp(
      ${filters.dateRange.start}
      )
      AND
      to_timestamp
      (
      ${filters.dateRange.end}
      )`,
    );
  }

  return { conditions, searchQuery };
}

function buildBookmarkExistsExpression(userId: string): SQL<boolean> {
  return sql`EXISTS
  (SELECT 1
   FROM ${bookmarkArticles} ba
            INNER JOIN ${bookmarks} b ON ba.bookmark_id = b.id
   WHERE ba.article_id = ${articles.id}
     AND b.user_id = ${userId})`;
}

async function fetchArticleOverview(
  db: Database,
  options: {
    userId: string;
    page: PageState;
    filters: NormalizedArticleFilters;
    baseConditions?: SQL[];
  },
): Promise<ArticleOverviewResult> {
  const baseConditions = options.baseConditions ?? [];
  const { conditions: filterConditions, searchQuery } =
    buildArticleFilterConditions(options.filters);
  const whereConditions = [...baseConditions, ...filterConditions];

  const bookmarkExpression = buildBookmarkExistsExpression(options.userId);

  const selectFields = {
    article_id: articles.id,
    articleTitle: articles.title,
    articleLink: articles.link,
    articleCategories: sql<string | null>`array_to_string
        (${articles.categories}, ',')`,
    article_excerpt: articles.excerpt,
    article_published_at: articles.publishedAt,
    article_image: articles.image,
    article_reading_time: articles.readingTime,
    sourceId: sources.id,
    source_display_name: sources.displayName,
    source_image: sql<string>`('${SOURCE_IMAGE_BASE}' || ${sources.name} || '.png')`,
    sourceUrl: sources.url,
    source_name: sources.name,
    source_created_at: sources.createdAt,
    article_is_bookmarked: bookmarkExpression,
  } satisfies Record<string, SQL | AnyColumn>;

  let query = db
    .select(selectFields)
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id));

  const cursor = decodeCursor(options.page.cursor);
  if (cursor?.date) {
    const comparison =
      options.filters.sortDirection === "asc"
        ? or(
            gt(articles.publishedAt, cursor.date),
            and(
              eq(articles.publishedAt, cursor.date),
              gt(articles.id, cursor.id),
            ),
          )
        : or(
            lt(articles.publishedAt, cursor.date),
            and(
              eq(articles.publishedAt, cursor.date),
              lt(articles.id, cursor.id),
            ),
          );
    whereConditions.push(comparison);
  }

  if (whereConditions.length === 1) {
    query = query.where(whereConditions[0]);
  } else if (whereConditions.length > 1) {
    query = query.where(and(...whereConditions));
  }

  const orderings: (SQL | AnyColumn)[] = [];
  if (searchQuery) {
    orderings.push(
      options.filters.sortDirection === "asc"
        ? sql`ts_rank
                  (${articles.tsv}, to_tsquery('french', ${searchQuery}))
                  ASC`
        : sql`ts_rank
                  (${articles.tsv}, to_tsquery('french', ${searchQuery}))
                  DESC`,
    );
  }

  if (options.filters.sortDirection === "asc") {
    orderings.push(asc(articles.publishedAt), asc(articles.id));
  } else {
    orderings.push(desc(articles.publishedAt), desc(articles.id));
  }

  const rows = await query.orderBy(...orderings).limit(options.page.limit + 1);

  return buildPaginationResult(rows, options.page, {
    id: "article_id",
    date: "article_published_at",
  });
}

export async function getArticleOverviewList(
  db: Database,
  params: {
    userId: string;
    page?: PageRequest;
    filters?: ArticleFilters;
  },
): Promise<ArticleOverviewResult> {
  const page = createPageState(params.page);
  const filters = normalizeArticleFilters(params.filters);

  return fetchArticleOverview(db, {
    userId: params.userId,
    page,
    filters,
  });
}

export async function getSourceArticleOverviewList(
  db: Database,
  params: {
    sourceId: string;
    userId: string;
    page?: PageRequest;
    filters?: ArticleFilters;
  },
): Promise<ArticleOverviewResult> {
  const page = createPageState(params.page);
  const filters = normalizeArticleFilters(params.filters);

  return fetchArticleOverview(db, {
    userId: params.userId,
    page,
    filters,
    baseConditions: [eq(sources.id, params.sourceId)],
  });
}

export async function getBookmarkedArticleList(
  db: Database,
  params: {
    userId: string;
    bookmarkId: string;
    page?: PageRequest;
    filters?: ArticleFilters;
  },
): Promise<ArticleOverviewResult> {
  const page = createPageState(params.page);
  const filters = normalizeArticleFilters(params.filters);
  const { conditions: filterConditions, searchQuery } =
    buildArticleFilterConditions(filters);

  const whereConditions: SQL[] = [
    eq(bookmarks.id, params.bookmarkId),
    eq(bookmarks.userId, params.userId),
    ...filterConditions,
  ];

  const selectFields = {
    article_id: articles.id,
    articleTitle: articles.title,
    articleLink: articles.link,
    articleCategories: sql<string | null>`array_to_string
        (${articles.categories}, ',')`,
    article_excerpt: articles.excerpt,
    article_published_at: articles.publishedAt,
    article_image: articles.image,
    article_reading_time: articles.readingTime,
    sourceId: sources.id,
    source_display_name: sources.displayName,
    source_image: sql<string>`('${SOURCE_IMAGE_BASE}' || ${sources.name} || '.png')`,
    sourceUrl: sources.url,
    source_name: sources.name,
    source_created_at: sources.createdAt,
    article_is_bookmarked: sql<boolean>`true`,
  } satisfies Record<string, SQL | AnyColumn>;

  let query = db
    .select(selectFields)
    .from(bookmarkArticles)
    .innerJoin(articles, eq(bookmarkArticles.articleId, articles.id))
    .innerJoin(bookmarks, eq(bookmarkArticles.bookmarkId, bookmarks.id))
    .innerJoin(sources, eq(articles.sourceId, sources.id));

  const cursor = decodeCursor(page.cursor);
  if (cursor?.date) {
    const comparison =
      filters.sortDirection === "asc"
        ? or(
            gt(articles.publishedAt, cursor.date),
            and(
              eq(articles.publishedAt, cursor.date),
              gt(articles.id, cursor.id),
            ),
          )
        : or(
            lt(articles.publishedAt, cursor.date),
            and(
              eq(articles.publishedAt, cursor.date),
              lt(articles.id, cursor.id),
            ),
          );
    whereConditions.push(comparison);
  }

  if (whereConditions.length === 1) {
    query = query.where(whereConditions[0]);
  } else if (whereConditions.length > 1) {
    query = query.where(and(...whereConditions));
  }

  const orderings: (SQL | AnyColumn)[] = [];
  if (searchQuery) {
    orderings.push(
      filters.sortDirection === "asc"
        ? sql`ts_rank
                  (${articles.tsv}, to_tsquery('french', ${searchQuery}))
                  ASC`
        : sql`ts_rank
                  (${articles.tsv}, to_tsquery('french', ${searchQuery}))
                  DESC`,
    );
  }

  if (filters.sortDirection === "asc") {
    orderings.push(asc(articles.publishedAt), asc(articles.id));
  } else {
    orderings.push(desc(articles.publishedAt), desc(articles.id));
  }

  const rows = await query.orderBy(...orderings).limit(page.limit + 1);

  return buildPaginationResult(rows, page, {
    id: "article_id",
    date: "article_published_at",
  });
}

export async function getArticleDetails(
  db: Database,
  params: { id: string; userId: string },
): Promise<ArticleDetailsRow | null> {
  const bookmarkExpression = buildBookmarkExistsExpression(params.userId);

  const [row] = await db
    .select({
      article_id: articles.id,
      articleTitle: articles.title,
      articleLink: articles.link,
      articleCategories: sql<string | null>`array_to_string
          (${articles.categories}, ',')`,
      articleBody: articles.body,
      article_hash: articles.hash,
      article_published_at: articles.publishedAt,
      article_crawled_at: articles.crawledAt,
      article_updated_at: articles.updatedAt,
      article_bias: articles.bias,
      article_reliability: articles.reliability,
      article_transparency: articles.transparency,
      article_sentiment: articles.sentiment,
      article_metadata: articles.metadata,
      article_reading_time: articles.readingTime,
      sourceId: sources.id,
      source_name: sources.name,
      source_description: sources.description,
      sourceUrl: sources.url,
      source_updated_at: sources.updatedAt,
      source_display_name: sources.displayName,
      source_bias: sources.bias,
      source_reliability: sources.reliability,
      source_transparency: sources.transparency,
      source_image: sql<string>`('${SOURCE_IMAGE_BASE}' || ${sources.name} || '.png')`,
      article_is_bookmarked: bookmarkExpression,
    })
    .from(articles)
    .innerJoin(sources, eq(articles.sourceId, sources.id))
    .where(eq(articles.id, params.id))
    .limit(1);

  return row ?? null;
}

export async function getArticleCommentList(
  db: Database,
  params: { articleId: string; page?: PageRequest },
): Promise<{ data: ArticleCommentRow[]; pagination: PaginationMeta }> {
  const page = createPageState(params.page);
  const whereConditions: SQL[] = [eq(comments.articleId, params.articleId)];

  const cursor = decodeCursor(page.cursor);
  if (cursor?.date) {
    whereConditions.push(
      or(
        lt(comments.createdAt, cursor.date),
        and(eq(comments.createdAt, cursor.date), lt(comments.id, cursor.id)),
      ),
    );
  }

  let query = db
    .select({
      comment_id: comments.id,
      comment_content: comments.content,
      comment_sentiment: comments.sentiment,
      comment_created_at: comments.createdAt,
      user_id: users.id,
      user_name: users.name,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id));

  if (whereConditions.length === 1) {
    query = query.where(whereConditions[0]);
  } else if (whereConditions.length > 1) {
    query = query.where(and(...whereConditions));
  }

  const rows = await query
    .orderBy(desc(comments.createdAt), desc(comments.id))
    .limit(page.limit + 1);

  return buildPaginationResult(rows, page, {
    id: "comment_id",
    date: "comment_created_at",
  });
}
