import { randomUUID } from "node:crypto";

import IORedis from "ioredis";
import { JobsOptions, Queue, QueueOptions } from "bullmq";
import { z } from "zod";

import {
  ArticleTaskPayload,
  ArticleTaskPayloadSchema,
  ListingTaskPayload,
  ListingTaskPayloadSchema,
  ProcessedTaskPayload,
  ProcessedTaskPayloadSchema,
} from "./schemas";
import { parseRedisUrl } from "@crawler/utils";

const QueueSettingsSchema = z.object({
  redis_url: z
    .string()
    .default(process.env.BASANGO_REDIS_URL ?? "redis://localhost:6379/0"),
  prefix: z.string().default(process.env.BASANGO_QUEUE_PREFIX ?? "crawler"),
  default_timeout: z
    .number()
    .int()
    .positive()
    .default(Number(process.env.BASANGO_QUEUE_TIMEOUT ?? 600)),
  result_ttl: z
    .number()
    .int()
    .nonnegative()
    .default(Number(process.env.BASANGO_QUEUE_RESULT_TTL ?? 3600)),
  failure_ttl: z
    .number()
    .int()
    .nonnegative()
    .default(Number(process.env.BASANGO_QUEUE_FAILURE_TTL ?? 3600)),
  listing_queue: z.string().default("listing"),
  article_queue: z.string().default("articles"),
  processed_queue: z.string().default("processed"),
});

export type QueueSettingsInput = z.input<typeof QueueSettingsSchema>;
export type QueueSettings = z.output<typeof QueueSettingsSchema>;

export const createQueueSettings = (
  input?: QueueSettingsInput,
): QueueSettings => QueueSettingsSchema.parse(input ?? {});

export interface QueueBackend<T = unknown> {
  add: (name: string, data: T, opts?: JobsOptions) => Promise<{ id: string }>;
}

export type QueueFactory = (
  queueName: string,
  settings: QueueSettings,
  connection?: IORedis,
) => QueueBackend;

const defaultQueueFactory: QueueFactory = (queueName, settings, connection) => {
  const redisConnection =
    connection ??
    new IORedis(settings.redis_url, parseRedisUrl(settings.redis_url));
  const options: QueueOptions = {
    connection: redisConnection,
    prefix: settings.prefix,
  };

  const queue = new Queue(queueName, options);
  return {
    add: async (name, data, opts) => {
      const job = await queue.add(name, data, {
        removeOnComplete: settings.result_ttl === 0 ? true : undefined,
        removeOnFail: settings.failure_ttl === 0 ? true : undefined,
        //timeout: settings.default_timeout * 1000,
        ...opts,
      });
      return { id: job.id ?? randomUUID() };
    },
  };
};

export interface CreateQueueManagerOptions {
  settings?: QueueSettings | QueueSettingsInput;
  queueFactory?: QueueFactory;
  connection?: IORedis;
}

export interface QueueManager {
  readonly settings: QueueSettings;
  readonly connection: IORedis;
  enqueueListing: (payload: ListingTaskPayload) => Promise<{ id: string }>;
  enqueueArticle: (payload: ArticleTaskPayload) => Promise<{ id: string }>;
  enqueueProcessed: (payload: ProcessedTaskPayload) => Promise<{ id: string }>;
  iterQueueNames: () => string[];
  queueName: (suffix: string) => string;
  close: () => Promise<void>;
}

export const createQueueManager = (
  options: CreateQueueManagerOptions = {},
): QueueManager => {
  const settings = createQueueSettings(
    options.settings as QueueSettingsInput | undefined,
  );

  const connection =
    options.connection ??
    new IORedis(settings.redis_url, parseRedisUrl(settings.redis_url));
  const factory = options.queueFactory ?? defaultQueueFactory;

  const ensureQueue = (queueName: string) =>
    factory(queueName, settings, connection);

  return {
    settings,
    connection,
    enqueueListing: (payload) => {
      const data = ListingTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(settings.listing_queue);
      return queue.add("collect_listing", data);
    },
    enqueueArticle: (payload) => {
      const data = ArticleTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(settings.article_queue);
      return queue.add("collect_article", data);
    },
    enqueueProcessed: (payload) => {
      const data = ProcessedTaskPayloadSchema.parse(payload);
      const queue = ensureQueue(settings.processed_queue);
      return queue.add("forward_for_processing", data);
    },
    iterQueueNames: () => [
      `${settings.prefix}:${settings.listing_queue}`,
      `${settings.prefix}:${settings.article_queue}`,
      `${settings.prefix}:${settings.processed_queue}`,
    ],
    queueName: (suffix: string) => `${settings.prefix}:${suffix}`,
    close: async () => {
      await connection.quit();
    },
  };
};
