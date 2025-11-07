import { randomUUID } from "node:crypto";
import { JobsOptions, Queue, QueueOptions } from "bullmq";
import IORedis from "ioredis";
import { config, FetchAsyncConfig } from "@/config";
import {
  DetailsTaskPayload,
  DetailsTaskPayloadSchema,
  ListingTaskPayload,
  ListingTaskPayloadSchema,
  ProcessingTaskPayload,
  ProcessingTaskPayloadSchema,
} from "@/process/async/schemas";
import { parseRedisUrl } from "@/utils";

export interface QueueBackend<T = unknown> {
  add: (name: string, data: T, opts?: JobsOptions) => Promise<{ id: string }>;
}

export type QueueFactory = (
  queueName: string,
  settings: FetchAsyncConfig,
  connection?: IORedis,
) => QueueBackend;

const defaultQueueFactory: QueueFactory = (queueName, settings, connection) => {
  const redisConnection =
    connection ??
    new IORedis(settings.redisUrl, {
      ...parseRedisUrl(settings.redisUrl),
      maxRetriesPerRequest: null,
    });
  const options: QueueOptions = {
    connection: redisConnection,
    prefix: settings.prefix,
  };

  const queue = new Queue(queueName, options);
  return {
    add: async (name, data, opts) => {
      const job = await queue.add(name, data, {
        removeOnComplete: settings.ttl.result === 0 ? true : undefined,
        removeOnFail: settings.ttl.failure === 0 ? true : undefined,
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
  readonly settings: FetchAsyncConfig;
  readonly connection: IORedis;
  enqueueListing: (payload: ListingTaskPayload) => Promise<{ id: string }>;
  enqueueArticle: (payload: DetailsTaskPayload) => Promise<{ id: string }>;
  enqueueProcessed: (payload: ProcessingTaskPayload) => Promise<{ id: string }>;
  iterQueueNames: () => string[];
  queueName: (suffix: string) => string;
  close: () => Promise<void>;
}

export const createQueueManager = (options: CreateQueueManagerOptions = {}): QueueManager => {
  const settings = config.fetch.async;

  const connection =
    options.connection ??
    new IORedis(settings.redisUrl, {
      ...parseRedisUrl(settings.redisUrl),
      maxRetriesPerRequest: null,
    });
  const factory = options.queueFactory ?? defaultQueueFactory;

  const ensureQueue = (queueName: string) => factory(queueName, settings, connection);

  return {
    close: async () => {
      await connection.quit();
    },
    connection,
    enqueueArticle: (payload) => {
      const data = DetailsTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(settings.queues.details);
      return queue.add("collect_article", data);
    },
    enqueueListing: (payload) => {
      const data = ListingTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(settings.queues.listing);
      return queue.add("collect_listing", data);
    },
    enqueueProcessed: (payload) => {
      const data = ProcessingTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(settings.queues.processing);
      return queue.add("forward_for_processing", data);
    },
    iterQueueNames: () => [
      `${settings.prefix}:${settings.queues.listing}`,
      `${settings.prefix}:${settings.queues.details}`,
      `${settings.prefix}:${settings.queues.processing}`,
    ],
    queueName: (suffix: string) => `${settings.prefix}:${suffix}`,
    settings,
  };
};
