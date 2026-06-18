import { logger } from "@basango/logger";

import { resolveSourceConfig } from "#crawler/config/sources";
import {
  CrawlingOptions,
  closeArticleOutbox,
  createArticleOutbox,
  resolveCrawlerConfig,
} from "#crawler/execution/crawl-runtime";
import { HtmlCrawler } from "#crawler/sources/html/html-crawler";
import { resolveSourceUpdateDates } from "#crawler/sources/source-update-window";
import { WordPressCrawler } from "#crawler/sources/wordpress/wordpress-crawler";

export const runSyncCrawl = async (options: CrawlingOptions): Promise<void> => {
  const source = resolveSourceConfig(options.sourceId);
  const settings = resolveCrawlerConfig(source, options);
  const articleOutbox = createArticleOutbox(source);
  await resolveSourceUpdateDates(settings);

  const crawler =
    source.sourceKind === "wordpress"
      ? new WordPressCrawler(settings, { articleOutbox })
      : new HtmlCrawler(settings, { articleOutbox });

  try {
    await crawler.fetch();
  } finally {
    closeArticleOutbox(articleOutbox);
  }

  logger.info({ ...options }, "Synchronous crawl completed");
};
