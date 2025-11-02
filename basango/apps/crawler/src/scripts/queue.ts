import { parseArgs } from "node:util";

import { logger } from "@basango/logger";
import { PipelineConfigManager } from "@/config";
import { createQueueSettings } from "@/process/async/queue";
import { scheduleAsyncCrawl } from "@/process/async/tasks";

interface QueueCliOptions {
  source?: string;
  env: string;
  page?: string;
  date?: string;
  category?: string;
  "redis-url"?: string;
  help?: boolean;
}

const usage = `
    Usage: bun run src/scripts/queue -- --source <id> [options]
    
    Options:
      --page <range>        Optional page range filter (e.g. 1:5)
      --date <range>        Optional date range filter (e.g. 2024-01-01:2024-01-31)
      --category <slug>     Optional category to crawl
      --redis-url <url>     Override Redis connection URL
      --env <env>           Environment to load (default: development)
      -h, --help            Show this message
`;

const parseCliArgs = (): QueueCliOptions => {
  const { values } = parseArgs({
    options: {
      source: { type: "string" },
      page: { type: "string" },
      date: { type: "string" },
      category: { type: "string" },
      "redis-url": { type: "string" },
      env: { type: "string", default: "development" },
      help: { type: "boolean", short: "h" },
    },
  });

  return values as QueueCliOptions;
};

const main = async (): Promise<void> => {
  const options = parseCliArgs();

  if (options.help || !options.source) {
    console.log(usage);
    if (!options.source) {
      process.exitCode = 1;
    }
    return;
  }

  const env = options.env ?? "development";
  const manager = new PipelineConfigManager({ env });
  manager.setupLogging(manager.get(env));

  const settings = options["redis-url"]
    ? createQueueSettings({ redis_url: options["redis-url"] })
    : undefined;

  try {
    const id = await scheduleAsyncCrawl({
      sourceId: options.source,
      env,
      pageRange: options.page ?? null,
      dateRange: options.date ?? null,
      category: options.category ?? null,
      settings,
    });

    logger.info({ id, ...options }, "Scheduled asynchronous crawl job");
  } catch (error) {
    logger.error({ error }, "Failed to schedule crawl job");
    process.exitCode = 1;
  }
};

void main();
