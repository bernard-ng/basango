import { logger } from "@basango/logger";

import * as handlers from "#crawler/process/async/handlers";
import { createQueueManager } from "#crawler/process/async/queue";
import { DetailsTaskPayloadSchema, ListingTaskPayloadSchema } from "#crawler/process/async/schemas";
import { CrawlingOptions } from "#crawler/process/crawler";

export const collectListing = async (payload: unknown): Promise<number> => {
  const data = ListingTaskPayloadSchema.parse(payload);
  logger.debug({ data }, "Collecting listing");

  const count = await handlers.collectHtmlListing(data);
  logger.info({ count }, "Listing collection completed");

  return count;
};

export const collectArticle = async (payload: unknown): Promise<unknown> => {
  const data = DetailsTaskPayloadSchema.parse(payload);
  logger.info({ data }, "Collecting article");

  const result = await handlers.collectArticle(data);
  logger.info({ url: data.url }, "Article collection completed");

  return result;
};

export const scheduleAsyncCrawl = async (options: CrawlingOptions): Promise<string> => {
  const payload = ListingTaskPayloadSchema.parse({
    category: options.category,
    dateRange: options.dateRange,
    pageRange: options.pageRange,
    sourceId: options.sourceId,
  });

  const manager = createQueueManager();
  logger.info({ payload }, "Scheduling listing collection job");

  try {
    const job = await manager.enqueueListing(payload);
    logger.info({ job }, "Scheduled listing collection job");

    return job.id;
  } finally {
    await manager.close();
  }
};
