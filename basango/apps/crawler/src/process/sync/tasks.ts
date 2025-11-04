import { resolveSourceConfig } from "@/utils";
import {
  closePersistors,
  CrawlingOptions,
  createPersistors,
  resolveCrawlerConfig,
} from "@/process/crawler";
import logger from "@basango/logger";
import { WordPressCrawler } from "@/process/parsers/wordpress";
import { HtmlCrawler } from "@/process/parsers/html";

export const runSyncCrawl = async (options: CrawlingOptions): Promise<void> => {
  const source = resolveSourceConfig(options.sourceId);
  const settings = resolveCrawlerConfig(source, options);
  const persistors = createPersistors(source);

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
