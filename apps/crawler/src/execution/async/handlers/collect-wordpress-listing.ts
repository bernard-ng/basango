import logger from "@basango/logger";

import { createTimestampRange } from "#crawler/config/ranges";
import { resolveSourceConfig } from "#crawler/config/sources";
import { collectHtmlListing } from "#crawler/execution/async/handlers/collect-html-listing";
import { QueueManager, createQueueManager } from "#crawler/execution/async/queue-manager";
import { DetailsTaskPayload, ListingTaskPayload } from "#crawler/execution/async/queue-schemas";
import { resolveCrawlerConfig } from "#crawler/execution/crawl-runtime";
import { resolveSourceUpdateDates } from "#crawler/sources/source-update-window";
import { WordPressCrawler } from "#crawler/sources/wordpress/wordpress-crawler";
import type { WordPressSourceOptions } from "#domain/config";

export const collectWordPressListing = async (
  payload: ListingTaskPayload,
  queueManager?: QueueManager,
): Promise<number> => {
  const manager = queueManager ?? createQueueManager();
  const shouldCloseManager = queueManager === undefined;

  try {
    const source = resolveSourceConfig(payload.sourceId) as WordPressSourceOptions;
    if (source.sourceKind !== "wordpress") {
      return await collectHtmlListing(payload, manager);
    }

    const settings = resolveCrawlerConfig(source, payload);
    await resolveSourceUpdateDates(settings);

    const crawler = new WordPressCrawler(settings);
    const pageRange = settings.pageRange ?? (await crawler.getPagination());

    let queued = 0;
    for (let page = pageRange.start; page <= pageRange.end; page += 1) {
      const url = crawler.buildEndpointUrl(page);

      try {
        const entries = await crawler.fetchLinks(url);
        for (const data of entries) {
          const url = data.link;
          if (!url) continue;

          await manager.enqueueArticle({
            category: payload.category,
            data,
            dateRange: createTimestampRange(payload.dateRange),
            sourceId: payload.sourceId,
            url,
          } as DetailsTaskPayload);
          queued += 1;
        }
      } catch (error) {
        logger.error({ error, page }, "Failed to fetch WordPress page");
      }
    }

    return queued;
  } finally {
    if (shouldCloseManager) {
      await manager.close();
    }
  }
};
