import fs from "node:fs";
import path from "node:path";
import { Article } from "@/schema";
import { countTokens } from "@/utils";
import logger from "@basango/logger";

export interface Persistor {
  persist(record: Article): Promise<void> | void;
  close: () => Promise<void> | void;
}

export interface PersistorOptions {
  directory: string;
  sourceId: string;
  suffix?: string;
  encoding?: BufferEncoding;
}

export const persist = async (payload: Article, persistors: Persistor[]): Promise<Article> => {
  const article = {
    ...payload,
    tokenStatistics: {
      title: countTokens(payload.title),
      body: countTokens(payload.body),
      excerpt: countTokens(payload.body.substring(0, 200)),
      categories: countTokens(payload.categories.join(",")),
    },
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

  persist(record: Article): Promise<void> {
    if (this.closed) {
      return Promise.reject(new Error("Persistor has been closed"));
    }

    const payload = `${JSON.stringify(record)}\n`;

    this.pending = this.pending.then(async () => {
      fs.writeFileSync(this.filePath, payload, {
        encoding: this.encoding,
        mode: "a",
      });
    });

    return this.pending;
  }

  async close(): Promise<void> {
    this.closed = true;
    await this.pending;
  }
}
