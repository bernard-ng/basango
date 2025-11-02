import {parseArgs} from "node:util";

import {logger} from "@basango/logger";

import {PipelineConfigManager} from "@crawler/config";
import {createQueueManager, createQueueSettings,} from "@crawler/services/async/queue";
import {startWorker} from "@crawler/services/async/worker";

interface WorkerCliOptions {
  env: string;
  queue?: string[];
  concurrency?: string;
  "redis-url"?: string;
  help?: boolean;
}

const usage = `Usage: bun run src/scripts/worker.ts [options]\n\nOptions:\n  --env <env>              Environment to load (default: development)\n  -q, --queue <name>       Queue name to listen on (repeatable)\n  --concurrency <number>   Number of concurrent jobs per worker\n  --redis-url <url>        Override Redis connection URL\n  -h, --help               Show this message`;

const parseCliArgs = (): WorkerCliOptions => {
  const {values} = parseArgs({
    options: {
      env: {type: "string", default: "development"},
      queue: {type: "string", multiple: true, short: "q"},
      concurrency: {type: "string"},
      "redis-url": {type: "string"},
      help: {type: "boolean", short: "h"},
    },
  });

  return values as WorkerCliOptions;
};

const parseConcurrency = (value?: string): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid concurrency value: ${value}`);
  }

  return parsed;
};

const main = async (): Promise<void> => {
  const options = parseCliArgs();

  if (options.help) {
    console.log(usage);
    return;
  }

  const env = options.env ?? "development";
  const manager = new PipelineConfigManager({env});
  const config = manager.ensureDirectories();
  manager.setupLogging(config);

  let concurrency: number | undefined;
  try {
    concurrency = parseConcurrency(options.concurrency);
  } catch (error) {
    logger.error(
      error instanceof Error ? error : {error},
      "Invalid concurrency value provided",
    );
    process.exitCode = 1;
    return;
  }
  const settings = options["redis-url"]
    ? createQueueSettings({redis_url: options["redis-url"]})
    : undefined;
  const queueManager = createQueueManager({settings});

  const queueNames = options.queue?.length
    ? options.queue.map((name) => queueManager.queueName(name))
    : undefined;

  const handle = startWorker({
    queueManager,
    queueNames,
    concurrency,
  });

  const shutdown = async (signal: NodeJS.Signals) => {
    logger.info({signal}, "Received shutdown signal, draining workers");
    try {
      await handle.close();
    } finally {
      await queueManager.close();
      process.exit(0);
    }
  };

  process.once("SIGINT", (signal) => {
    void shutdown(signal);
  });
  process.once("SIGTERM", (signal) => {
    void shutdown(signal);
  });

  logger.info(
    {
      env,
      queueNames: queueNames ?? queueManager.iterQueueNames(),
      concurrency: concurrency ?? "default",
    },
    "Crawler workers started",
  );
};

void main();
