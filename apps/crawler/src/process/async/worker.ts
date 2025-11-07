import { QueueEvents, Worker } from "bullmq";
import IORedis from "ioredis";

import { QueueFactory, QueueManager } from "@/process/async/queue";
import { collectArticle, collectListing, forwardForProcessing } from "@/process/async/tasks";

export interface WorkerOptions {
  queueNames?: string[];
  connection?: IORedis;
  queueFactory?: QueueFactory;
  concurrency?: number;
  onError?: (error: Error) => void;
  queueManager: QueueManager;
}

export interface WorkerHandle {
  readonly workers: Worker[];
  readonly events: QueueEvents[];
  close: () => Promise<void>;
}

export const startWorker = (options: WorkerOptions): WorkerHandle => {
  const manager = options.queueManager;
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
        concurrency: options.concurrency ?? 5,
        connection,
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
