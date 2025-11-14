import fs from "node:fs";
import path from "node:path";
import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

import { logger } from "@basango/logger";

import { config, env } from "#crawler/config";
import { SyncHttpClient } from "#crawler/http/http-client";
import type { Article } from "#crawler/schema";

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

const forwardArticle = async (article: Article): Promise<void> => {
  const client = new SyncHttpClient(config.fetch.client);
  const endpoint = env("BASANGO_CRAWLER_BACKEND_API_ENDPOINT");
  const token = env("BASANGO_CRAWLER_TOKEN");

  try {
    const response = await client.post(endpoint, {
      headers: {
        Authorization: `${token}`,
      },
      json: article,
    });

    if (response.ok) {
      const data = await response.json();
      logger.info({ ...data }, "Article forwarded");
      return;
    }

    logger.error({ link: article.link, status: response.status }, "Forwarding failed");
  } catch (error) {
    logger.error({ error, link: article.link }, "Failed to forward article");
  }
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
        await forwardArticle({
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
