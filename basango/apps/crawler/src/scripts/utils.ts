import { parseArgs } from "node:util";
import { CrawlingOptions } from "@/process/crawler";

interface WorkerCliOptions {
  queue?: string[];
}

export const CRAWLING_USAGE = `
    Usage: bun run crawl:[async|sync] -- --sourceId <id> [options]
    
    Options:
      --page <range>        Optional page range filter (e.g. 1:5)
      --date <range>        Optional date range filter (e.g. 2024-01-01:2024-01-31)
      --category <slug>     Optional category to crawl
      -h, --help            Show this message
`;

export const parseWorkerCliArgs = (): WorkerCliOptions => {
  const { values } = parseArgs({
    options: {
      queue: { type: "string", multiple: true, short: "q" },
    },
  });

  return values as WorkerCliOptions;
};

export const parseCrawlingCliArgs = (): CrawlingOptions => {
  const { values } = parseArgs({
    options: {
      sourceId: { type: "string" },
      page: { type: "string" },
      date: { type: "string" },
      category: { type: "string" },
    },
  });

  return values as CrawlingOptions;
};
