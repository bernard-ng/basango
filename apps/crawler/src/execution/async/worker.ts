import IORedis from "ioredis";

import {
  type JobInstance,
  QueueEvents,
  type QueueEventsInstance,
  Worker,
  type WorkerInstance,
} from "#crawler/execution/async/bullmq";
import { QueueFactory, QueueManager } from "#crawler/execution/async/queue-manager";
import { collectArticle, collectListing } from "#crawler/execution/async/scheduler";

export interface WorkerOptions {
  queueNames?: string[];
  connection?: IORedis;
  queueFactory?: QueueFactory;
  concurrency?: number;
  onError?: (error: Error) => void;
  queueManager: QueueManager;
}

export interface WorkerHandle {
  readonly workers: WorkerInstance[];
  readonly events: QueueEventsInstance[];
  close: () => Promise<void>;
}

export const startWorker = (options: WorkerOptions): WorkerHandle => {
  const manager = options.queueManager;
  const queueNames = options.queueNames ?? manager.iterQueueNames();
  const workers: WorkerInstance[] = [];
  const events: QueueEventsInstance[] = [];

  const connection = manager.connection;

  for (const queueName of queueNames) {
    const worker = new Worker(
      queueName,
      async (job: JobInstance) => {
        switch (job.name) {
          case "collect_listing":
            return collectListing(job.data);
          case "collect_article":
            return collectArticle(job.data);
          default:
            throw new Error(`Unknown job name: ${job.name}`);
        }
      },
      {
        concurrency: options.concurrency ?? 5,
        connection,
        prefix: manager.options.prefix,
      },
    );

    if (options.onError) {
      worker.on("failed", (_: JobInstance | undefined, err: Error) => options.onError?.(err));
      worker.on("error", (err: Error) => options.onError?.(err));
    }

    const queueEvents = new QueueEvents(queueName, {
      connection,
      prefix: manager.options.prefix,
    });

    workers.push(worker);
    events.push(queueEvents);
  }

  return {
    close: async () => {
      await Promise.all(workers.map((worker) => worker.close()));
      await Promise.all(events.map((event) => event.close()));

      if (!options.queueManager) {
        await manager.close();
      }
    },
    events,
    workers,
  };
};
