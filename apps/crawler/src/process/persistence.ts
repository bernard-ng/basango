import fs from "node:fs";
import path from "node:path";

import type { Article } from "@basango/domain/models";
import { md5 } from "@basango/encryption";
import logger from "@basango/logger";

import { config, env } from "#crawler/config";
import { HttpError, SyncHttpClient } from "#crawler/http/http-client";

export interface Persistor {
  persist(record: Partial<Article>): Promise<void> | void;
  close: () => Promise<void> | void;
}

export interface PersistorOptions {
  directory: string;
  sourceId: string;
  suffix?: string;
  encoding?: BufferEncoding;
}

const sanitize = (text: string): string => {
  if (!text) return text;

  let s = text.replace(/\u00A0/g, " "); // remove NBSP
  s = s.replace(" ", " "); // remove other NBSP
  s = s.replace(" ", " "); // remove NARROW NO-BREAK SPACE
  s = s.replace(/\u200B/g, ""); // remove ZERO WIDTH SPACE
  s = s.replace(/\u200C/g, ""); // remove ZERO WIDTH NON-JOINER
  s = s.replace(/\u200D/g, ""); // remove ZERO WIDTH JOINER
  s = s.replace(/\uFEFF/g, ""); // remove ZERO WIDTH NO-BREAK SPACE
  s = s.replace(/\r\n/g, "\n"); // normalize CRLF to LF
  s = s.replace(/\n{2,}/g, "\n"); // collapse multiple newlines to one
  // s = s.replace(/[ \t]{2,}/g, " "); // collapse multiple spaces/tabs

  return s.trim();
};

export const persist = async (
  payload: Partial<Article>,
  persistors: Persistor[],
): Promise<Article> => {
  const data = {
    ...payload,
    body: sanitize(payload.body!),
    categories: payload.categories!.map(sanitize),
    title: sanitize(payload.title!),
  };

  const article = {
    ...data,
    hash: md5(data.link!),
  } as Article;

  for (const persistor of persistors) {
    try {
      await persistor.persist(article);
    } catch (error) {
      logger.error({ error }, "Failed to persist article record");
    }
  }

  logger.info({ url: article.link }, "article successfully persisted");
  return article;
};

export const forward = async (payload: Partial<Article>): Promise<void> => {
  const client = new SyncHttpClient(config.fetch.client);
  const endpoint = env("BASANGO_CRAWLER_BACKEND_API_ENDPOINT");
  const token = env("BASANGO_CRAWLER_TOKEN");

  try {
    const response = await client.post(endpoint, {
      headers: {
        Authorization: `${token}`,
      },
      json: payload,
    });

    if (response.ok) {
      const data = await response.json();
      logger.info({ ...data }, "Article forwarded");
      return;
    }

    logger.error({ status: response.status, url: payload.link }, "Forwarding failed");
  } catch (error) {
    if (error instanceof HttpError) {
      const data = await error.response.json();
      logger.error({ ...data, url: payload.link }, "Error forwarding article");
      return;
    }

    logger.error({ error, url: payload.link }, "Error forwarding article");
  }
};

export class JsonlPersistor implements Persistor {
  private readonly filePath: string;
  private readonly encoding: BufferEncoding;
  private pending: Promise<void> = Promise.resolve();
  private closed = false;

  constructor(options: PersistorOptions) {
    const suffix = options.suffix ?? ".jsonl";
    this.encoding = options.encoding ?? "utf-8";

    fs.mkdirSync(options.directory, { recursive: true });
    this.filePath = path.join(options.directory, `${options.sourceId}${suffix}`);

    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, "", { encoding: this.encoding });
    }
  }

  persist(payload: Partial<Article>): Promise<void> {
    if (this.closed) {
      return Promise.reject(new Error("Persistor has been closed"));
    }

    const record = `${JSON.stringify(payload)}\n`;

    this.pending = this.pending.then(async () => {
      fs.appendFileSync(this.filePath, record, { encoding: this.encoding });
    });

    return this.pending;
  }

  async close(): Promise<void> {
    this.closed = true;
    await this.pending;
  }
}
