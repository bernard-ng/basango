import { config, FetchCrawlerConfig } from "@/config";
import { JsonlPersistor, Persistor } from "@/process/persistence";
import { AnySourceConfig } from "@/schema";
import logger from "@basango/logger";
import { createDateRange, createPageRange } from "@/utils";

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
    source,
    dateRange: createDateRange(options.dateRange),
    pageRange: createPageRange(options.pageRange),
    category: options.category,
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
