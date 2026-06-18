#!/usr/bin/env bun

import os from "node:os";
import { parseArgs } from "node:util";

import { logger } from "@basango/logger";

import { ArticleForwarder } from "#crawler/articles/article-forwarder";
import { ArticleOutbox } from "#crawler/articles/article-outbox";
import { resolveCrawlerSqlitePath } from "#crawler/config/paths";
import { createQueueManager } from "#crawler/execution/async/queue-manager";
import { scheduleAsyncCrawl } from "#crawler/execution/async/scheduler";
import { startWorker } from "#crawler/execution/async/worker";
import type { CrawlingOptions } from "#crawler/execution/crawl-runtime";
import { runSyncCrawl } from "#crawler/execution/sync-crawl-runner";

const VERSION = "0.0.0";

const USAGE = `
Usage: basango-crawler <command> [options]

Commands:
  worker    Process crawler queues
  schedule  Schedule async crawls for one or more sources
  sync      Run a synchronous crawl for one source
  push      Push pending/failed SQLite articles to the backend
  version   Print version information

Common crawl options:
  --sourceId <id>       Source identifier. Can be repeated for schedule.
  --pageRange <range>   Optional page range filter (e.g. 1:5)
  --dateRange <range>   Optional date range filter (e.g. 2024-01-01:2024-01-31)
  --category <slug>     Optional category to crawl

Worker options:
  --queue, -q <name>    Queue to process. Can be repeated.

Push options:
  --sourceId <id>       Optional source filter
  --limit <count>       Max articles to push in one run (default: 100)
`;

interface ScheduleOptions extends Omit<CrawlingOptions, "sourceId"> {
  sourceIds: string[];
}

interface PushOptions {
  sourceId?: string;
  limit: number;
}

const splitSourceIds = (value: string | undefined): string[] => {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

export const resolveScheduleSourceIds = (explicit: string[] = []): string[] => {
  if (explicit.length > 0) {
    return explicit;
  }

  return splitSourceIds(process.env.BASANGO_CRAWLER_SOURCE_IDS);
};

export const parseScheduleOptions = (args: string[]): ScheduleOptions => {
  const { values } = parseArgs({
    allowPositionals: false,
    args,
    options: {
      category: { type: "string" },
      dateRange: { type: "string" },
      pageRange: { type: "string" },
      sourceId: { multiple: true, type: "string" },
    },
  });
  const sourceIdValues = values.sourceId;
  const sourceIds = resolveScheduleSourceIds(
    Array.isArray(sourceIdValues)
      ? sourceIdValues
      : typeof sourceIdValues === "string"
        ? [sourceIdValues]
        : [],
  );

  return {
    category: values.category,
    dateRange: values.dateRange,
    pageRange: values.pageRange,
    sourceIds,
  };
};

const parseCrawlingOptions = (args: string[]): CrawlingOptions => {
  const { values } = parseArgs({
    allowPositionals: false,
    args,
    options: {
      category: { type: "string" },
      dateRange: { type: "string" },
      pageRange: { type: "string" },
      sourceId: { type: "string" },
    },
  });

  if (!values.sourceId) {
    throw new Error("--sourceId is required");
  }

  return {
    category: values.category,
    dateRange: values.dateRange,
    pageRange: values.pageRange,
    sourceId: values.sourceId,
  };
};

const parseWorkerOptions = (args: string[]): { queue?: string[] } => {
  const { values } = parseArgs({
    allowPositionals: false,
    args,
    options: {
      queue: { multiple: true, short: "q", type: "string" },
    },
  });

  return {
    queue: values.queue?.length ? values.queue : undefined,
  };
};

export const parsePushOptions = (args: string[]): PushOptions => {
  const { values } = parseArgs({
    allowPositionals: false,
    args,
    options: {
      limit: { type: "string" },
      sourceId: { type: "string" },
    },
  });

  const limit = values.limit ? Number(values.limit) : 100;
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("--limit must be a positive integer");
  }

  return {
    limit,
    sourceId: values.sourceId,
  };
};

const runWorker = async (args: string[]): Promise<void> => {
  const options = parseWorkerOptions(args);
  const manager = createQueueManager();
  const handle = startWorker({
    queueManager: manager,
    queueNames: options.queue,
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
  logger.info({ queueNames: options.queue }, "Crawler workers started");

  await new Promise(() => undefined);
};

const runSchedule = async (args: string[]): Promise<void> => {
  const options = parseScheduleOptions(args);
  if (options.sourceIds.length === 0) {
    throw new Error(
      "No sources provided. Pass --sourceId or set BASANGO_CRAWLER_SOURCE_IDS=source-a,source-b",
    );
  }

  for (const sourceId of options.sourceIds) {
    const id = await scheduleAsyncCrawl({
      category: options.category,
      dateRange: options.dateRange,
      pageRange: options.pageRange,
      sourceId,
    });
    logger.info({ id, sourceId }, "Scheduled asynchronous crawl job");
  }
};

const runPush = async (args: string[]): Promise<void> => {
  const options = parsePushOptions(args);
  const sqlitePath = resolveCrawlerSqlitePath();
  if (!ArticleOutbox.exists(sqlitePath)) {
    throw new Error(`SQLite outbox does not exist: ${sqlitePath}`);
  }

  const outbox = new ArticleOutbox({ create: false, filePath: sqlitePath });
  const forwarder = new ArticleForwarder();

  let forwardedCount = 0;
  let failedCount = 0;
  try {
    const claimId = `${os.hostname()}:${process.pid}:${Date.now()}`;
    const articles = outbox.claim({
      ...options,
      claimedBy: claimId,
    });

    logger.info(
      { claimed: articles.length, claimId, sourceId: options.sourceId, sqlitePath },
      "Pushing articles from SQLite outbox",
    );

    for (const article of articles) {
      const forwarded = await forwarder.forward(article.payload);
      if (forwarded.ok) {
        outbox.markForwarded(article.hash);
        forwardedCount += 1;
      } else {
        outbox.markFailed(
          article.hash,
          new Error(forwarded.message ?? "Failed to forward article"),
          forwarded.retryable,
        );
        failedCount += 1;
      }
    }
  } finally {
    outbox.close();
  }

  logger.info(
    { failed: failedCount, forwarded: forwardedCount, sourceId: options.sourceId },
    "Push completed",
  );

  if (failedCount > 0) {
    throw new Error(`Failed to push ${failedCount} article(s)`);
  }
};

export const runCli = async (args: string[] = process.argv.slice(2)): Promise<number> => {
  const [command, ...rest] = args;

  try {
    switch (command) {
      case "worker":
        await runWorker(rest);
        return 0;
      case "schedule":
        await runSchedule(rest);
        return 0;
      case "sync":
        await runSyncCrawl(parseCrawlingOptions(rest));
        return 0;
      case "push":
        await runPush(rest);
        return 0;
      case "version":
        console.log(`basango-crawler ${VERSION}`);
        return 0;
      case undefined:
      case "help":
      case "--help":
      case "-h":
        console.log(USAGE);
        return command === undefined ? 1 : 0;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    logger.error({ err: error }, "Crawler command failed");
    return 1;
  }
};

if (import.meta.main) {
  process.exitCode = await runCli();
}
