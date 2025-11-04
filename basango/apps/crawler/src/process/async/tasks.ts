import { logger } from "@basango/logger";

import {
  DetailsTaskPayloadSchema,
  ListingTaskPayloadSchema,
  ProcessingTaskPayloadSchema,
} from "@/process/async/schemas";
import { createQueueManager } from "@/process/async/queue";
import * as handlers from "@/process/async/handlers";
import { CrawlingOptions } from "@/process/crawler";

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

export const forwardForProcessing = async (payload: unknown): Promise<unknown> => {
  const data = ProcessingTaskPayloadSchema.parse(payload);
  logger.debug({ sourceId: data.sourceId }, "Forwarding article for processing");

  const result = await handlers.forwardForProcessing(data);
  logger.info({ result }, "Article forwarded for processing");

  return result;
};

export const scheduleAsyncCrawl = async (options: CrawlingOptions): Promise<string> => {
  const payload = ListingTaskPayloadSchema.parse({
    sourceId: options.sourceId,
    pageRange: options.pageRange,
    dateRange: options.dateRange,
    category: options.category,
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
