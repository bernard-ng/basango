import { logger } from "@basango/logger";

import { config, env } from "@/config";
import { Article, HtmlSourceConfig, SourceKindSchema, WordPressSourceConfig } from "@/schema";
import { createDateRange, formatDateRange, formatPageRange, resolveSourceConfig } from "@/utils";
import {
  DetailsTaskPayload,
  ListingTaskPayload,
  ProcessingTaskPayload,
} from "@/process/async/schemas";
import { createQueueManager, QueueManager } from "@/process/async/queue";
import { HtmlCrawler } from "@/process/parsers/html";
import { WordPressCrawler } from "@/process/parsers/wordpress";
import { JsonlPersistor } from "@/process/persistence";
import { SyncHttpClient } from "@/http/http-client";

import { resolveCrawlerConfig } from "@/process/crawler";

export const collectHtmlListing = async (
  payload: ListingTaskPayload,
  manager: QueueManager = createQueueManager(),
): Promise<number> => {
  const source = resolveSourceConfig(payload.sourceId) as HtmlSourceConfig;
  if (source.sourceKind !== "html") {
    return await collectWordPressListing(payload, manager);
  }

  const settings = resolveCrawlerConfig(source, payload);
  const crawler = new HtmlCrawler(settings);
  const pageRange = settings.pageRange ?? (await crawler.getPagination());

  let queued = 0;
  for (let page = pageRange.start; page <= pageRange.end; page += 1) {
    const target = crawler.buildPageUrl(page) ?? `${source.sourceUrl}`;

    try {
      const items = await crawler.fetchLinks(target, source.sourceSelectors.articles);
      for (const node of items) {
        const url = crawler.extractLink(node);
        if (!url) continue;

        await manager.enqueueArticle({
          url,
          sourceId: payload.sourceId,
          category: payload.category,
          dateRange: createDateRange(payload.dateRange),
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
  const source = resolveSourceConfig(payload.sourceId) as WordPressSourceConfig;
  if (source.sourceKind !== "wordpress") {
    return await collectHtmlListing(payload, manager);
  }

  const settings = resolveCrawlerConfig(source, payload);
  const crawler = new WordPressCrawler(settings);
  const pageRange = settings.pageRange ?? (await crawler.getPagination());

  let queued = 0;
  for (let page = pageRange.start; page <= pageRange.end; page += 1) {
    const url = crawler.postsEndpoint(page);

    try {
      const entries = await crawler.fetchLinks(url);
      for (const data of entries) {
        const url = data.link;
        if (!url) continue;

        await manager.enqueueArticle({
          url,
          data,
          sourceId: payload.sourceId,
          category: payload.category,
          dateRange: createDateRange(payload.dateRange),
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
    pageRange: payload.pageRange ? formatPageRange(payload.pageRange) : undefined,
    dateRange: payload.dateRange ? formatDateRange(payload.dateRange) : undefined,
    sourceId: payload.sourceId,
    category: payload.category,
  });
  const persistors = [
    new JsonlPersistor({
      directory: config.paths.data,
      sourceId: String(source.sourceId),
    }),
  ];

  if (source.sourceKind === SourceKindSchema.enum.html) {
    if (!payload.url) throw new Error("Missing article url");
    const crawler = new HtmlCrawler(settings, { persistors });
    const html = await crawler.crawl(payload.url);
    return await crawler.fetchOne(html, settings.dateRange);
  }

  if (source.sourceKind === SourceKindSchema.enum.wordpress) {
    const crawler = new WordPressCrawler(settings, { persistors });
    return await crawler.fetchOne(payload.data ?? {}, settings.dateRange);
  }

  throw new Error(`Unsupported source kind`);
};

export const forwardForProcessing = async (payload: ProcessingTaskPayload): Promise<Article> => {
  logger.info({ article: payload.article.title }, "Ready for downstream processing");

  const client = new SyncHttpClient(config.fetch.client);
  const endpoint = env("BASANGO_CRAWLER_BACKEND_API_ENDPOINT");

  await client.post(endpoint, { json: payload.article });
  logger.info({ article: payload.article.title }, "Forwarded article to API");

  return payload.article;
};
