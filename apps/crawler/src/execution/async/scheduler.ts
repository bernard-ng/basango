import { logger } from "@basango/logger";

import { collectArticle as collectArticle1 } from "#crawler/execution/async/handlers/collect-article";
import { collectHtmlListing } from "#crawler/execution/async/handlers/collect-html-listing";
import { createQueueManager } from "#crawler/execution/async/queue-manager";
import {
  DetailsTaskPayloadSchema,
  ListingTaskPayloadSchema,
} from "#crawler/execution/async/queue-schemas";
import { CrawlingOptions } from "#crawler/execution/crawl-runtime";

export const collectListing = async (payload: unknown): Promise<number> => {
  const data = ListingTaskPayloadSchema.parse(payload);
  logger.debug({ data }, "Collecting listing");

  const count = await collectHtmlListing(data);
  logger.info({ count }, "Listing collection completed");

  return count;
};

export const collectArticle = async (payload: unknown): Promise<unknown> => {
  const data = DetailsTaskPayloadSchema.parse(payload);
  logger.info({ data }, "Collecting article");

  const result = await collectArticle1(data);
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
