import type { AnySourceConfig } from "@basango/domain/crawler";
import logger from "@basango/logger";

import { FetchCrawlerConfig, config } from "#crawler/config";
import { JsonlPersistor, Persistor } from "#crawler/process/persistence";
import { createPageRange, createTimestampRange } from "#crawler/utils";

export interface CrawlingOptions {
  sourceId: string;
  pageRange?: string | undefined;
  dateRange?: string | undefined;
  category?: string | undefined;
}

export const resolveCrawlerConfig = (
  source: AnySourceConfig,
  options: CrawlingOptions,
): FetchCrawlerConfig => {
  return {
    ...config.fetch.crawler,
    category: options.category,
    dateRange: createTimestampRange(options.dateRange),
    pageRange: createPageRange(options.pageRange),
    source,
  };
};

export const createPersistors = (source: AnySourceConfig): Persistor[] => {
  return [
    new JsonlPersistor({
      directory: config.paths.data,
      sourceId: source.sourceId,
    }),
  ];
};

export const closePersistors = async (persistors: Persistor[]): Promise<void> => {
  for (const persistor of persistors) {
    try {
      await persistor.close();
    } catch (error) {
      logger.warn({ error }, "Failed to close persistor");
    }
  }
};
