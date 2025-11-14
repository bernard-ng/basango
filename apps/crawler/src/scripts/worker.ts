import { logger } from "@basango/logger";

import { createQueueManager } from "#crawler/process/async/queue";
import { startWorker } from "#crawler/process/async/worker";
import { parseWorkerCliArgs } from "#crawler/scripts/utils";

const main = async (): Promise<void> => {
  const options = parseWorkerCliArgs();

  const manager = createQueueManager();
  const queues = options.queue?.length ? options.queue : undefined;

  const handle = startWorker({
    queueManager: manager,
    queueNames: queues,
  });

  const shutdown = async (signal: NodeJS.Signals) => {
    logger.info({ signal }, "Received shutdown signal, draining workers");
    try {
      await handle.close();
    } finally {
      await manager.close();
      process.exit(0);
    }
  };

  process.once("SIGINT", (signal) => void shutdown(signal));
  process.once("SIGTERM", (signal) => void shutdown(signal));
  logger.info({ queueNames: queues }, "Crawler workers started");
};

void main();
