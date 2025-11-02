import IORedis from "ioredis";
import { QueueEvents, Worker } from "bullmq";

import {
  createQueueManager,
  QueueFactory,
  QueueManager,
  QueueSettings,
  QueueSettingsInput,
} from "@/process/async/queue";
import {
  collectArticle,
  collectListing,
  forwardForProcessing,
} from "@/process/async/tasks";

export interface WorkerOptions {
  queueNames?: string[];
  settings?: QueueSettings | QueueSettingsInput;
  connection?: IORedis;
  queueFactory?: QueueFactory;
  concurrency?: number;
  onError?: (error: Error) => void;
  queueManager?: QueueManager;
}

export interface WorkerHandle {
  readonly workers: Worker[];
  readonly events: QueueEvents[];
  close: () => Promise<void>;
}

export const startWorker = (options: WorkerOptions = {}): WorkerHandle => {
  const manager =
    options.queueManager ??
    createQueueManager({
      settings: options.settings,
      connection: options.connection,
      queueFactory: options.queueFactory,
    });

  const queueNames = options.queueNames ?? manager.iterQueueNames();
  const workers: Worker[] = [];
  const events: QueueEvents[] = [];

  const connection = manager.connection;

  for (const queueName of queueNames) {
    const worker = new Worker(
      queueName,
      async (job) => {
        switch (job.name) {
          case "collect_listing":
            return collectListing(job.data);
          case "collect_article":
            return collectArticle(job.data);
          case "forward_for_processing":
            return forwardForProcessing(job.data);
          default:
            throw new Error(`Unknown job name: ${job.name}`);
        }
      },
      {
        connection,
        concurrency: options.concurrency ?? 5,
      },
    );

    if (options.onError) {
      worker.on("failed", (_, err) => options.onError?.(err as Error));
      worker.on("error", (err) => options.onError?.(err as Error));
    }

    const queueEvents = new QueueEvents(queueName, { connection });

    workers.push(worker);
    events.push(queueEvents);
  }

  return {
    workers,
    events,
    close: async () => {
      await Promise.all(workers.map((worker) => worker.close()));
      await Promise.all(events.map((event) => event.close()));

      if (!options.queueManager) {
        await manager.close();
      }
    },
  };
};
