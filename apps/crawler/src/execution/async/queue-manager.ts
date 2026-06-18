import { createHash, randomUUID } from "node:crypto";

import { type CrawlerAsyncOptions, config } from "@basango/domain/config";
import IORedis from "ioredis";

import { parseRedisUrl } from "#crawler/config/redis";
import { type JobsOptions, Queue } from "#crawler/execution/async/bullmq";
import {
  DetailsTaskPayload,
  DetailsTaskPayloadSchema,
  ListingTaskPayload,
  ListingTaskPayloadSchema,
} from "#crawler/execution/async/queue-schemas";

export interface QueueBackend<T = unknown> {
  add: (name: string, data: T, opts?: JobsOptions) => Promise<{ id: string }>;
  close?: () => Promise<void>;
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
        removeOnComplete: options.ttl.result === 0 ? true : { age: options.ttl.result },
        removeOnFail: options.ttl.failure === 0 ? true : { age: options.ttl.failure },
        ...opts,
      });
      return { id: job.id ?? randomUUID() };
    },
    close: () => queue.close(),
  };
};

const createStableJobId = (prefix: string, payload: unknown): string => {
  const hash = createHash("sha1").update(JSON.stringify(payload)).digest("hex");
  return `${prefix}-${hash}`;
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
  const queues = new Map<string, QueueBackend>();

  const ensureQueue = (queueName: string) => {
    const existing = queues.get(queueName);
    if (existing) return existing;

    const queue = factory(queueName, asyncOptions, connection);
    queues.set(queueName, queue);
    return queue;
  };

  return {
    close: async () => {
      await Promise.all([...queues.values()].map((queue) => queue.close?.()));
      await connection.quit();
    },
    connection,
    enqueueArticle: (payload) => {
      const data = DetailsTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(asyncOptions.queues.details);
      return queue.add("collect_article", data, {
        jobId: createStableJobId("article", {
          sourceId: data.sourceId,
          url: data.url,
        }),
      });
    },
    enqueueListing: (payload) => {
      const data = ListingTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(asyncOptions.queues.listing);
      return queue.add("collect_listing", data, {
        jobId: createStableJobId("listing", data),
      });
    },
    iterQueueNames: () => [asyncOptions.queues.listing, asyncOptions.queues.details],
    options: asyncOptions,
    queueName: (suffix: string) => `${asyncOptions.prefix}:${suffix}`,
  };
};
