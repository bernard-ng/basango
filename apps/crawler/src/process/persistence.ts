import fs from "node:fs";
import path from "node:path";
import logger from "@basango/logger";
import { Article } from "@/schema";
import { countTokens } from "@/utils";

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

export const persist = async (payload: Article, persistors: Persistor[]): Promise<Article> => {
  const data = {
    ...payload,
    body: sanitize(payload.body),
    categories: payload.categories.map(sanitize),
    title: sanitize(payload.title),
  };

  const article = {
    ...data,
    tokenStatistics: {
      body: countTokens(payload.body),
      categories: countTokens(payload.categories.join(",")),
      excerpt: countTokens(payload.body.substring(0, 200)),
      title: countTokens(payload.title),
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
      fs.appendFileSync(this.filePath, payload, { encoding: this.encoding });
    });

    return this.pending;
  }

  async close(): Promise<void> {
    this.closed = true;
    await this.pending;
  }
}
