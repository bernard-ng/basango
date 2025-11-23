import { AnySourceOptions, CrawlerFetchingOptions, config } from "@basango/domain/config";
import logger from "@basango/logger";

import { JsonlPersistor, Persistor } from "#crawler/process/persistence";
import { createPageRange, createTimestampRange } from "#crawler/utils";

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

export const createPersistors = (source: AnySourceOptions): Persistor[] => {
  return [
    new JsonlPersistor({
      directory: config.crawler.paths.data,
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
