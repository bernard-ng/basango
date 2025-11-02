import {parseArgs} from "node:util";

import {logger} from "@basango/logger";

import {PipelineConfigManager} from "@crawler/config";
import {createQueueSettings} from "@crawler/services/async/queue";
import {scheduleAsyncCrawl} from "@crawler/services/async/tasks";

interface QueueCliOptions {
  "source-id"?: string;
  env: string;
  "page-range"?: string;
  "date-range"?: string;
  category?: string;
  "redis-url"?: string;
  help?: boolean;
}

const usage = `Usage: bun run src/scripts/queue.ts -- --source-id <id> [options]\n\nOptions:\n  --env <env>              Environment to load (default: development)\n  --page-range <range>     Optional page range filter (e.g. 1:5)\n  --date-range <range>     Optional date range filter (e.g. 2024-01-01:2024-01-31)\n  --category <slug>        Optional category to crawl\n  --redis-url <url>        Override Redis connection URL\n  -h, --help               Show this message`;

const parseCliArgs = (): QueueCliOptions => {
  const {values} = parseArgs({
    options: {
      "source-id": {type: "string"},
      env: {type: "string", default: "development"},
      "page-range": {type: "string"},
      "date-range": {type: "string"},
      category: {type: "string"},
      "redis-url": {type: "string"},
      help: {type: "boolean", short: "h"},
    },
  });

  return values as QueueCliOptions;
};

const main = async (): Promise<void> => {
  const options = parseCliArgs();

  if (options.help || !options["source-id"]) {
    console.log(usage);
    if (!options["source-id"]) {
      process.exitCode = 1;
    }
    return;
  }

  const env = options.env ?? "development";
  const manager = new PipelineConfigManager({env});
  const config = manager.ensureDirectories();
  manager.setupLogging(config);

  const settings = options["redis-url"]
    ? createQueueSettings({redis_url: options["redis-url"]})
    : undefined;

  try {
    const jobId = await scheduleAsyncCrawl({
      sourceId: options["source-id"],
      env,
      pageRange: options["page-range"] ?? null,
      dateRange: options["date-range"] ?? null,
      category: options.category ?? null,
      settings,
    });

    logger.info(
      {
        jobId,
        sourceId: options["source-id"],
        env,
      },
      "Scheduled asynchronous crawl job",
    );
    console.log(
      `Scheduled async crawl job ${jobId} for source '${options["source-id"]}' (env=${env})`,
    );
  } catch (error) {
    logger.error(
      error instanceof Error ? error : {error},
      "Failed to schedule crawl job",
    );
    console.error(`Failed to schedule crawl job: ${(error as Error).message}`);
    process.exitCode = 1;
  }
};

void main();
