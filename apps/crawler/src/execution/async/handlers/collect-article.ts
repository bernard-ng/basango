import logger from "@basango/logger";

import { formatPageRange, formatTimestampRange } from "#crawler/config/ranges";
import { resolveSourceConfig } from "#crawler/config/sources";
import {
  ArticleOutOfDateRangeError,
  InvalidArticleError,
  UnsupportedSourceKindError,
} from "#crawler/errors";
import { DetailsTaskPayload } from "#crawler/execution/async/queue-schemas";
import {
  closeArticleOutbox,
  createArticleOutbox,
  resolveCrawlerConfig,
} from "#crawler/execution/crawl-runtime";
import { HtmlCrawler } from "#crawler/sources/html/html-crawler";
import { WordPressCrawler } from "#crawler/sources/wordpress/wordpress-crawler";

export const collectArticle = async (payload: DetailsTaskPayload): Promise<unknown> => {
  const source = resolveSourceConfig(payload.sourceId);
  const settings = resolveCrawlerConfig(source, {
    category: payload.category,
    dateRange: payload.dateRange ? formatTimestampRange(payload.dateRange) : undefined,
    pageRange: payload.pageRange ? formatPageRange(payload.pageRange) : undefined,
    sourceId: payload.sourceId,
  });
  const articleOutbox = createArticleOutbox(source);

  try {
    if (source.sourceKind === "html") {
      const crawler = new HtmlCrawler(settings, { articleOutbox });
      const html = await crawler.crawl(payload.url);

      return await crawler.fetchOne(html, settings.dateRange, payload.url);
    }

    if (source.sourceKind === "wordpress") {
      const crawler = new WordPressCrawler(settings, { articleOutbox });

      return await crawler.fetchOne(payload.data ?? {}, settings.dateRange);
    }

    throw new UnsupportedSourceKindError(`Unsupported source kind`);
  } catch (error) {
    if (error instanceof ArticleOutOfDateRangeError || error instanceof InvalidArticleError) {
      logger.info({ error, url: payload.url }, "Skipping article");
      return { reason: error.name, skipped: true, url: payload.url };
    }

    throw error;
  } finally {
    closeArticleOutbox(articleOutbox);
  }
};
