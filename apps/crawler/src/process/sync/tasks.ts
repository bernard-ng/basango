import logger from "@basango/logger";

import {
  CrawlingOptions,
  closePersistors,
  createPersistors,
  resolveCrawlerConfig,
} from "#crawler/process/crawler";
import { HtmlCrawler } from "#crawler/process/parsers/html";
import { WordPressCrawler } from "#crawler/process/parsers/wordpress";
import { resolveSourceConfig, resolveSourceUpdateDates } from "#crawler/utils";

export const runSyncCrawl = async (options: CrawlingOptions): Promise<void> => {
  const source = resolveSourceConfig(options.sourceId);
  const settings = resolveCrawlerConfig(source, options);
  const persistors = createPersistors(source);
  await resolveSourceUpdateDates(settings);

  const crawler =
    source.sourceKind === "wordpress"
      ? new WordPressCrawler(settings, { persistors })
      : new HtmlCrawler(settings, { persistors });

  try {
    await crawler.fetch();
  } finally {
    await closePersistors(persistors);
  }

  logger.info({ ...options }, "Synchronous crawl completed");
};
