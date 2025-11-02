import { logger } from "@basango/logger";

import { PipelineConfigManager } from "@/config";
import { JsonlPersistor, Persistor } from "@/persistence";
import {
  AnySourceConfig,
  ClientConfig,
  CrawlerConfig,
  CrawlerConfigSchema,
  PipelineConfig,
  SourceKind,
} from "@/schema";
import { createDateRange } from "@/utils";
import { PageRangeSchema, PageRangeSpecSchema } from "@/schema";

export interface CrawlerInstance {
  fetch: () => Promise<void> | void;
  close?: () => Promise<void> | void;
}

export interface CrawlerContext {
  pipeline: PipelineConfig;
  source: AnySourceConfig;
  clientConfig: ClientConfig;
  crawlerConfig: CrawlerConfig;
  persistors: Persistor[];
}

export type CrawlerFactory = (context: CrawlerContext) => CrawlerInstance;

const registry = new Map<SourceKind, CrawlerFactory>();

export const registerCrawler = (kind: SourceKind, factory: CrawlerFactory): void => {
  registry.set(kind, factory);
};

export const clearCrawlerRegistry = (): void => {
  registry.clear();
};

export interface RunSyncCrawlOptions {
  sourceId: string;
  env?: string;
  pageRange?: string | null;
  dateRange?: string | null;
  category?: string | null;
  notify?: boolean;
  manager?: PipelineConfigManager;
  persistFactory?: (context: {
    pipeline: PipelineConfig;
    source: AnySourceConfig;
    resolvedSourceId: string;
  }) => Persistor[];
}

const resolvePageRange = (spec?: string | null) => {
  if (!spec) return undefined;
  const parsed = PageRangeSpecSchema.parse(spec);
  return PageRangeSchema.parse(parsed);
};

const resolveCrawlerConfig = (
  source: AnySourceConfig,
  options: RunSyncCrawlOptions,
): CrawlerConfig => {
  const page_range = resolvePageRange(options.pageRange);
  const date_range = options.dateRange ? createDateRange(options.dateRange) : undefined;

  return CrawlerConfigSchema.parse({
    source,
    page_range,
    date_range,
    category: options.category ?? undefined,
    notify: options.notify ?? false,
  });
};

const createPersistors = (
  context: { pipeline: PipelineConfig; source: AnySourceConfig; sourceId: string },
  factory?: RunSyncCrawlOptions["persistFactory"],
): Persistor[] => {
  if (factory) {
    return factory({
      pipeline: context.pipeline,
      source: context.source,
      resolvedSourceId: context.sourceId,
    });
  }

  return [
    new JsonlPersistor({
      directory: context.pipeline.paths.data,
      sourceId: context.sourceId,
    }),
  ];
};

export const runSyncCrawl = async (options: RunSyncCrawlOptions): Promise<void> => {
  const env = options.env ?? "development";
  const manager = options.manager ?? new PipelineConfigManager({ env });
  const pipeline = manager.get(env);
  manager.setupLogging(pipeline);

  const source = pipeline.sources.find(options.sourceId);
  if (!source) {
    throw new Error(`Source '${options.sourceId}' not found in configuration`);
  }

  const crawlerConfig = resolveCrawlerConfig(source, options);
  const sourceId = source.source_id ?? options.sourceId;
  const persistors = createPersistors({ pipeline, source, sourceId }, options.persistFactory);

  const factory = registry.get(source.source_kind as SourceKind);
  if (!factory) {
    throw new Error(`No crawler registered for source kind '${source.source_kind}'`);
  }

  const context: CrawlerContext = {
    pipeline,
    source,
    clientConfig: pipeline.fetch.client,
    crawlerConfig,
    persistors,
  };

  const crawler = factory(context);
  if (!crawler || typeof crawler.fetch !== "function") {
    throw new Error("Registered crawler did not return a valid instance");
  }

  try {
    await crawler.fetch();
    logger.info(
      {
        sourceId: options.sourceId,
        kind: source.source_kind,
        env,
      },
      "Synchronous crawl completed",
    );
  } finally {
    for (const persistor of persistors) {
      try {
        await persistor.close?.();
      } catch (error) {
        logger.warn({ error }, "Failed to close persistor");
      }
    }

    if (typeof crawler.close === "function") {
      try {
        await crawler.close();
      } catch (error) {
        logger.warn({ error }, "Failed to close crawler");
      }
    }
  }
};
