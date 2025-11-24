import type { HtmlSourceOptions, WordPressSourceOptions } from "@basango/domain/config";
import { logger } from "@basango/logger";

import { UnsupportedSourceKindError } from "#crawler/errors";
import { QueueManager, createQueueManager } from "#crawler/process/async/queue";
import { DetailsTaskPayload, ListingTaskPayload } from "#crawler/process/async/schemas";
import { createPersistors, resolveCrawlerConfig } from "#crawler/process/crawler";
import { HtmlCrawler } from "#crawler/process/parsers/html";
import { WordPressCrawler } from "#crawler/process/parsers/wordpress";
import {
  createTimestampRange,
  formatPageRange,
  formatTimestampRange,
  resolveSourceConfig,
  resolveSourceUpdateDates,
} from "#crawler/utils";

export const collectHtmlListing = async (
  payload: ListingTaskPayload,
  manager: QueueManager = createQueueManager(),
): Promise<number> => {
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
};

export const collectWordPressListing = async (
  payload: ListingTaskPayload,
  manager: QueueManager = createQueueManager(),
): Promise<number> => {
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
};

export const collectArticle = async (payload: DetailsTaskPayload): Promise<unknown> => {
  const source = resolveSourceConfig(payload.sourceId);
  const settings = resolveCrawlerConfig(source, {
    category: payload.category,
    dateRange: payload.dateRange ? formatTimestampRange(payload.dateRange) : undefined,
    pageRange: payload.pageRange ? formatPageRange(payload.pageRange) : undefined,
    sourceId: payload.sourceId,
  });
  const persistors = createPersistors(source);

  if (source.sourceKind === "html") {
    const crawler = new HtmlCrawler(settings, { persistors });
    const html = await crawler.crawl(payload.url);

    return await crawler.fetchOne(html, settings.dateRange);
  }

  if (source.sourceKind === "wordpress") {
    const crawler = new WordPressCrawler(settings, { persistors });

    return await crawler.fetchOne(payload.data ?? {}, settings.dateRange);
  }

  throw new UnsupportedSourceKindError(`Unsupported source kind`);
};
