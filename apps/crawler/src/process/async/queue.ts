import { randomUUID } from "node:crypto";

import { type CrawlerAsyncOptions, config } from "@basango/domain/config";
import { JobsOptions, Queue } from "bullmq";
import IORedis from "ioredis";

import {
  DetailsTaskPayload,
  DetailsTaskPayloadSchema,
  ListingTaskPayload,
  ListingTaskPayloadSchema,
  ProcessingTaskPayload,
  ProcessingTaskPayloadSchema,
} from "#crawler/process/async/schemas";
import { parseRedisUrl } from "#crawler/utils";

export interface QueueBackend<T = unknown> {
  add: (name: string, data: T, opts?: JobsOptions) => Promise<{ id: string }>;
}

export type QueueFactory = (
  queueName: string,
  options: CrawlerAsyncOptions,
  connection?: IORedis,
) => QueueBackend;

const defaultQueueFactory: QueueFactory = (queueName, options, connection) => {
  const redisConnection =
    connection ??
    new IORedis(options.redisUrl, {
      ...parseRedisUrl(options.redisUrl),
      maxRetriesPerRequest: null,
    });

  const queue = new Queue(queueName, {
    connection: redisConnection,
    prefix: options.prefix,
  });
  return {
    add: async (name, data, opts) => {
      const job = await queue.add(name, data, {
        removeOnComplete: options.ttl.result === 0 ? true : undefined,
        removeOnFail: options.ttl.failure === 0 ? true : undefined,
        ...opts,
      });
      return { id: job.id ?? randomUUID() };
    },
  };
};

export interface CreateQueueManagerOptions {
  queueFactory?: QueueFactory;
  connection?: IORedis;
}

export interface QueueManager {
  readonly options: CrawlerAsyncOptions;
  readonly connection: IORedis;
  enqueueListing: (payload: ListingTaskPayload) => Promise<{ id: string }>;
  enqueueArticle: (payload: DetailsTaskPayload) => Promise<{ id: string }>;
  enqueueProcessed: (payload: ProcessingTaskPayload) => Promise<{ id: string }>;
  iterQueueNames: () => string[];
  queueName: (suffix: string) => string;
  close: () => Promise<void>;
}

export const createQueueManager = (options: CreateQueueManagerOptions = {}): QueueManager => {
  const asyncOptions = config.crawler.fetch.async;

  const connection =
    options.connection ??
    new IORedis(asyncOptions.redisUrl, {
      ...parseRedisUrl(asyncOptions.redisUrl),
      maxRetriesPerRequest: null,
    });
  const factory = options.queueFactory ?? defaultQueueFactory;

  const ensureQueue = (queueName: string) => factory(queueName, asyncOptions, connection);

  return {
    close: async () => {
      await connection.quit();
    },
    connection,
    enqueueArticle: (payload) => {
      const data = DetailsTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(asyncOptions.queues.details);
      return queue.add("collect_article", data);
    },
    enqueueListing: (payload) => {
      const data = ListingTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(asyncOptions.queues.listing);
      return queue.add("collect_listing", data);
    },
    enqueueProcessed: (payload) => {
      const data = ProcessingTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(asyncOptions.queues.processing);
      return queue.add("forward_for_processing", data);
    },
    iterQueueNames: () => [
      asyncOptions.queues.listing,
      asyncOptions.queues.details,
      asyncOptions.queues.processing,
    ],
    options: asyncOptions,
    queueName: (suffix: string) => `${asyncOptions.prefix}:${suffix}`,
  };
};
