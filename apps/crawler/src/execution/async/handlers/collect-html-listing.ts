import logger from "@basango/logger";

import { createTimestampRange } from "#crawler/config/ranges";
import { resolveSourceConfig } from "#crawler/config/sources";
import { collectWordPressListing } from "#crawler/execution/async/handlers/collect-wordpress-listing";
import { QueueManager, createQueueManager } from "#crawler/execution/async/queue-manager";
import { DetailsTaskPayload, ListingTaskPayload } from "#crawler/execution/async/queue-schemas";
import { resolveCrawlerConfig } from "#crawler/execution/crawl-runtime";
import { HtmlCrawler } from "#crawler/sources/html/html-crawler";
import { resolveSourceUpdateDates } from "#crawler/sources/source-update-window";
import type { HtmlSourceOptions } from "#domain/config";

export const collectHtmlListing = async (
  payload: ListingTaskPayload,
  queueManager?: QueueManager,
): Promise<number> => {
  const manager = queueManager ?? createQueueManager();
  const shouldCloseManager = queueManager === undefined;

  try {
    const source = resolveSourceConfig(payload.sourceId) as HtmlSourceOptions;
    if (source.sourceKind !== "html") {
      return await collectWordPressListing(payload, manager);
    }

    const settings = resolveCrawlerConfig(source, payload);
    await resolveSourceUpdateDates(settings);

    const crawler = new HtmlCrawler(settings);
    const pageRange = settings.pageRange ?? (await crawler.getPagination());

    let queued = 0;
    for (let page = pageRange.start; page <= pageRange.end; page += 1) {
      const target = crawler.buildEndpointUrl(page) ?? `${source.sourceUrl}`;

      try {
        const items = await crawler.fetchLinks(target, source.sourceSelectors.articles);
        for (const node of items) {
          const url = crawler.extractLink(node);
          if (!url) continue;

          await manager.enqueueArticle({
            category: payload.category,
            dateRange: createTimestampRange(payload.dateRange),
            sourceId: payload.sourceId,
            url,
          } as DetailsTaskPayload);
          queued += 1;
        }
      } catch (error) {
        logger.error({ error, target }, "Failed to crawl page");
      }
    }

    return queued;
  } finally {
    if (shouldCloseManager) {
      await manager.close();
    }
  }
};
