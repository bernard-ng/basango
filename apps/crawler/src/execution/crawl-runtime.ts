import { AnySourceOptions, CrawlerFetchingOptions, config } from "@basango/domain/config";
import { logger } from "@basango/logger";

import { ArticleOutbox } from "#crawler/articles/article-outbox";
import { resolveCrawlerSqlitePath } from "#crawler/config/paths";
import { createPageRange, createTimestampRange } from "#crawler/config/ranges";

export interface CrawlingOptions {
  sourceId: string;
  pageRange?: string | undefined;
  dateRange?: string | undefined;
  category?: string | undefined;
}

export const resolveCrawlerConfig = (
  source: AnySourceOptions,
  options: CrawlingOptions,
): CrawlerFetchingOptions => {
  return {
    ...config.crawler.fetch.crawler,
    category: options.category,
    dateRange: createTimestampRange(options.dateRange),
    pageRange: createPageRange(options.pageRange),
    source,
  };
};

export const createArticleOutbox = (_source: AnySourceOptions): ArticleOutbox => {
  return new ArticleOutbox({
    filePath: resolveCrawlerSqlitePath(),
  });
};

export const closeArticleOutbox = (articleOutbox: ArticleOutbox): void => {
  try {
    articleOutbox.close();
  } catch (error) {
    logger.warn({ err: error }, "Failed to close SQLite article outbox");
  }
};
