import { parseArgs } from "node:util";

import { CrawlingOptions } from "#crawler/process/crawler";

interface WorkerCliOptions {
  queue?: string[];
}

export const CRAWLING_USAGE = `
    Usage: bun run crawler:[async|sync] -- --sourceId <id> [options]
    
    Options:
      --pageRange <range>   Optional page range filter (e.g. 1:5)
      --dateRange <range>   Optional date range filter (e.g. 2024-01-01:2024-01-31)
      --category <slug>     Optional category to crawl
`;

export const parseWorkerCliArgs = (): WorkerCliOptions => {
  const { values } = parseArgs({
    options: {
      queue: { multiple: true, short: "q", type: "string" },
    },
  });

  return values as WorkerCliOptions;
};

export const parseCrawlingCliArgs = (): CrawlingOptions => {
  const { values } = parseArgs({
    options: {
      category: { type: "string" },
      dateRange: { type: "string" },
      pageRange: { type: "string" },
      sourceId: { type: "string" },
    },
  });

  return values as CrawlingOptions;
};
