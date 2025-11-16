#! /usr/bin/env bun
import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

import type { Article } from "@basango/domain/models";
import { logger } from "@basango/logger";

import { config } from "#crawler/config";
import { forward } from "#crawler/process/persistence";

const USAGE = `
  Usage: bun run crawler:sync -- --sourceId <id>
`;

const parseCliArgs = (): { sourceId?: string } => {
  const { values } = parseArgs({
    options: {
      sourceId: { type: "string" },
    },
  });
  return values as { sourceId?: string };
};

const main = async (): Promise<void> => {
  const { sourceId } = parseCliArgs();
  if (!sourceId) {
    console.log(USAGE);
    process.exitCode = 1;
    return;
  }

  const filePath = path.join(config.paths.data, `${sourceId}.jsonl`);

  if (!fs.existsSync(filePath)) {
    logger.error({ filePath, sourceId }, "Source must be crawled first; JSONL not found");
    process.exitCode = 1;
    return;
  }

  const stat = fs.statSync(filePath);
  if (stat.size === 0) {
    logger.error({ filePath, sourceId }, "Source must be crawled first; JSONL is empty");
    process.exitCode = 1;
    return;
  }

  logger.info({ filePath, sourceId }, "Syncing articles from JSONL to backend");

  const stream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = createInterface({ crlfDelay: Infinity, input: stream });

  let count = 0;
  try {
    for await (const raw of rl) {
      const line = raw.trim();
      if (!line) continue;

      try {
        const article = JSON.parse(line) as Article & { publishedAt: string };
        await forward({
          ...article,
          publishedAt: new Date(article.publishedAt),
        });

        count += 1;
      } catch (error) {
        logger.error({ error, linePreview: line.slice(0, 100) }, "Invalid JSONL line");
      }
    }
  } finally {
    rl.close();
  }

  logger.info({ forwarded: count, sourceId }, "Sync completed");
};

void main();
