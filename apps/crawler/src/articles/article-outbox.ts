import { Database } from "bun:sqlite";
import fs from "node:fs";
import path from "node:path";

import type { Article } from "@basango/domain/models";

export type ArticleOutboxStatus = "pending" | "forwarded" | "failed";

export interface ArticleOutboxSaveResult {
  status?: ArticleOutboxStatus;
}

export interface OutboxArticle {
  attempts: number;
  body: string;
  categories: string[];
  claimedAt: Date | undefined;
  claimedBy: string | undefined;
  createdAt: Date;
  forwardedAt: Date | undefined;
  hash: string;
  lastError: string | undefined;
  link: string;
  metadata: Article["metadata"] | undefined;
  payload: Partial<Article>;
  publishedAt: Date;
  retryable: boolean;
  sourceId: string;
  status: ArticleOutboxStatus;
  title: string;
  updatedAt: Date;
}

export interface ClaimArticleBatchOptions {
  claimedBy: string;
  claimTtlMs?: number;
  limit?: number;
  sourceId?: string;
}

export interface ArticleOutboxOptions {
  filePath: string;
  create?: boolean;
}

interface ArticleRow {
  hash: string;
  source_id: string;
  link: string;
  title: string;
  body: string;
  categories: string;
  metadata: string | null;
  published_at: string;
  payload: string;
  status: ArticleOutboxStatus;
  attempts: number;
  retryable: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
  forwarded_at: string | null;
  claimed_at: string | null;
  claimed_by: string | null;
}

export interface ListOutboxArticlesOptions {
  sourceId?: string;
  limit?: number;
}

const isoDate = (value: Date | string | number | undefined): string => {
  if (value === undefined) {
    throw new Error("Article publishedAt is required for SQLite outbox storage");
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Article publishedAt must be a valid date");
  }

  return date.toISOString();
};

const now = (): string => new Date().toISOString();

const serializeArticle = (article: Partial<Article>): string => {
  return JSON.stringify({
    ...article,
    publishedAt: isoDate(article.publishedAt),
  });
};

const parseJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const rowToOutboxArticle = (row: ArticleRow): OutboxArticle => {
  const payload = parseJson<Partial<Article> & { publishedAt?: string }>(row.payload, {});

  return {
    attempts: row.attempts,
    body: row.body,
    categories: parseJson<string[]>(row.categories, []),
    claimedAt: row.claimed_at ? new Date(row.claimed_at) : undefined,
    claimedBy: row.claimed_by ?? undefined,
    createdAt: new Date(row.created_at),
    forwardedAt: row.forwarded_at ? new Date(row.forwarded_at) : undefined,
    hash: row.hash,
    lastError: row.last_error ?? undefined,
    link: row.link,
    metadata: parseJson<Article["metadata"] | undefined>(row.metadata, undefined),
    payload: {
      ...payload,
      publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : new Date(row.published_at),
    },
    publishedAt: new Date(row.published_at),
    retryable: row.retryable === 1,
    sourceId: row.source_id,
    status: row.status,
    title: row.title,
    updatedAt: new Date(row.updated_at),
  };
};

const resolveHash = (article: Partial<Article> | string): string | undefined => {
  return typeof article === "string" ? article : article.hash;
};

export class ArticleOutbox {
  private readonly db: Database;

  constructor(options: ArticleOutboxOptions) {
    const filePath = options.filePath.trim();
    if (!filePath) {
      throw new Error("ArticleOutbox requires a non-empty file path");
    }

    const create = options.create ?? true;
    if (!create && !fs.existsSync(filePath)) {
      throw new Error(`SQLite outbox does not exist: ${filePath}`);
    }

    if (create) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }

    this.db = new Database(filePath, { create });
    this.migrate();
  }

  static exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  save(article: Partial<Article>): ArticleOutboxSaveResult {
    return {
      status: this.upsertArticle(article),
    };
  }

  private upsertArticle(article: Partial<Article>): ArticleOutboxStatus {
    if (!article.hash || !article.sourceId || !article.link || !article.title || !article.body) {
      throw new Error("Cannot save incomplete article to SQLite outbox");
    }

    const publishedAt = isoDate(article.publishedAt);
    const timestamp = now();
    const categories = JSON.stringify(article.categories ?? []);
    const metadata = article.metadata ? JSON.stringify(article.metadata) : null;
    const payload = serializeArticle(article);

    this.db
      .prepare(`
        INSERT INTO articles (
          hash,
          source_id,
          link,
          title,
          body,
          categories,
          metadata,
          published_at,
          payload,
          status,
          attempts,
          retryable,
          last_error,
          created_at,
          updated_at,
          forwarded_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 1, NULL, ?, ?, NULL)
        ON CONFLICT(hash) DO UPDATE SET
          source_id = excluded.source_id,
          link = excluded.link,
          title = excluded.title,
          body = excluded.body,
          categories = excluded.categories,
          metadata = excluded.metadata,
          published_at = excluded.published_at,
          payload = excluded.payload,
          status = CASE
            WHEN articles.status = 'forwarded' THEN 'forwarded'
            ELSE 'pending'
          END,
          last_error = CASE
            WHEN articles.status = 'forwarded' THEN articles.last_error
            ELSE NULL
          END,
          retryable = CASE
            WHEN articles.status = 'forwarded' THEN articles.retryable
            ELSE 1
          END,
          updated_at = excluded.updated_at,
          forwarded_at = CASE
            WHEN articles.status = 'forwarded' THEN articles.forwarded_at
            ELSE NULL
          END
      `)
      .run(
        article.hash,
        article.sourceId,
        article.link,
        article.title,
        article.body,
        categories,
        metadata,
        publishedAt,
        payload,
        timestamp,
        timestamp,
      );

    const row = this.db
      .prepare("SELECT status FROM articles WHERE hash = ?")
      .get(article.hash) as Pick<ArticleRow, "status"> | null;

    return row?.status ?? "pending";
  }

  listPending(options: ListOutboxArticlesOptions = {}): OutboxArticle[] {
    const limit = options.limit ?? 100;
    if (options.sourceId) {
      const rows = this.db
        .prepare(`
          SELECT * FROM articles
          WHERE status IN ('pending', 'failed') AND source_id = ?
            AND retryable = 1
          ORDER BY created_at ASC
          LIMIT ?
        `)
        .all(options.sourceId, limit) as ArticleRow[];

      return rows.map(rowToOutboxArticle);
    }

    const rows = this.db
      .prepare(`
        SELECT * FROM articles
        WHERE status IN ('pending', 'failed')
          AND retryable = 1
        ORDER BY created_at ASC
        LIMIT ?
      `)
      .all(limit) as ArticleRow[];

    return rows.map(rowToOutboxArticle);
  }

  claim(options: ClaimArticleBatchOptions): OutboxArticle[] {
    const limit = options.limit ?? 100;
    const claimedAt = now();
    const expiresBefore = new Date(
      Date.now() - (options.claimTtlMs ?? 15 * 60 * 1000),
    ).toISOString();

    if (options.sourceId) {
      const rows = this.db
        .prepare(`
          UPDATE articles
          SET claimed_at = ?,
              claimed_by = ?,
              updated_at = ?
          WHERE hash IN (
            SELECT hash FROM articles
            WHERE status IN ('pending', 'failed')
              AND retryable = 1
              AND source_id = ?
              AND (claimed_at IS NULL OR claimed_at < ?)
            ORDER BY created_at ASC
            LIMIT ?
          )
          RETURNING *
        `)
        .all(
          claimedAt,
          options.claimedBy,
          claimedAt,
          options.sourceId,
          expiresBefore,
          limit,
        ) as ArticleRow[];

      return rows.map(rowToOutboxArticle);
    }

    const rows = this.db
      .prepare(`
        UPDATE articles
        SET claimed_at = ?,
            claimed_by = ?,
            updated_at = ?
        WHERE hash IN (
          SELECT hash FROM articles
          WHERE status IN ('pending', 'failed')
            AND retryable = 1
            AND (claimed_at IS NULL OR claimed_at < ?)
          ORDER BY created_at ASC
          LIMIT ?
        )
        RETURNING *
      `)
      .all(claimedAt, options.claimedBy, claimedAt, expiresBefore, limit) as ArticleRow[];

    return rows.map(rowToOutboxArticle);
  }

  markForwarded(article: Partial<Article> | string): void {
    const hash = resolveHash(article);
    if (!hash) return;

    const timestamp = now();
    this.db
      .prepare(`
        UPDATE articles
        SET status = 'forwarded',
            last_error = NULL,
            retryable = 0,
            updated_at = ?,
            forwarded_at = ?,
            claimed_at = NULL,
            claimed_by = NULL
        WHERE hash = ?
      `)
      .run(timestamp, timestamp, hash);
  }

  markFailed(article: Partial<Article> | string, error: unknown, retryable = true): void {
    const hash = resolveHash(article);
    if (!hash) return;

    const message = error instanceof Error ? error.message : String(error);
    this.db
      .prepare(`
        UPDATE articles
        SET status = 'failed',
            attempts = attempts + 1,
            retryable = ?,
            last_error = ?,
            updated_at = ?,
            claimed_at = NULL,
            claimed_by = NULL
        WHERE hash = ?
      `)
      .run(retryable ? 1 : 0, message, now(), hash);
  }

  getArticle(hash: string): OutboxArticle | undefined {
    const row = this.db
      .prepare("SELECT * FROM articles WHERE hash = ?")
      .get(hash) as ArticleRow | null;

    return row ? rowToOutboxArticle(row) : undefined;
  }

  close(): void {
    this.db.close();
  }

  private migrate(): void {
    this.db.exec("PRAGMA journal_mode = WAL");
    this.db.exec("PRAGMA synchronous = NORMAL");
    this.db.exec("PRAGMA busy_timeout = 5000");
    this.db.exec("PRAGMA foreign_keys = ON");
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS articles (
        hash TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        link TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        categories TEXT NOT NULL DEFAULT '[]',
        metadata TEXT,
        published_at TEXT NOT NULL,
        payload TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'forwarded', 'failed')),
        attempts INTEGER NOT NULL DEFAULT 0,
        retryable INTEGER NOT NULL DEFAULT 1,
        last_error TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        forwarded_at TEXT,
        claimed_at TEXT,
        claimed_by TEXT
      )
    `);
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS articles_status_created_at_idx ON articles(status, created_at)",
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS articles_source_status_idx ON articles(source_id, status)",
    );
    this.db.exec(
      "CREATE INDEX IF NOT EXISTS articles_claimed_at_created_at_idx ON articles(claimed_at, created_at)",
    );
  }
}
