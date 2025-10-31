import type { SQL } from "drizzle-orm";
import { and, desc, eq, sql } from "drizzle-orm";

import type { Database } from "@db/client";
import { articles, sources } from "@db/schema";

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
  const batchSize = params.batchSize && params.batchSize > 0
    ? params.batchSize
    : 1000;

  const filters: SQL[] = [];

  if (params.source) {
    filters.push(eq(sources.name, params.source));
  }

  if (params.dateRange) {
    filters.push(
      sql`${articles.publishedAt} BETWEEN to_timestamp(${params.dateRange.start}) AND to_timestamp(${params.dateRange.end})`,
    );
  }

  let query = db
    .select({
      articleId: articles.id,
      articleTitle: articles.title,
      articleLink: articles.link,
      articleCategories: sql<string | null>`array_to_string(${articles.categories}, ',')`,
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
