#!/usr/bin/env bun

import { config } from "@basango/domain/config";
import { Pool } from "pg";

import { computeTokenStatistics } from "#db/utils/computed";

type ArticleRow = {
  id: string;
  title: string;
  body: string;
  categories: string[];
};

class Engine {
  private readonly db: Pool;
  private readonly pageSize: number = 1000;
  private readonly batchSize: number = 50;

  constructor(database: string) {
    this.db = new Pool({
      allowExitOnIdle: true,
      connectionString: database,
      max: 16,
    });
    console.log(
      `Engine initialized with pageSize=${this.pageSize} and batchSize=${this.batchSize}`,
    );
  }

  async synchronize() {
    const client = await this.db.connect();
    console.log("Starting token statistics computation...");

    try {
      let cursor: string | null = null; // keyset pagination cursor on id (DESC)
      for (;;) {
        const params: Array<number | string> = [this.pageSize];
        const sql: string = cursor
          ? `SELECT id, title, body, COALESCE(categories, ARRAY[]::text[]) AS categories
             FROM article
             WHERE token_statistics IS NULL AND id < $2
             ORDER BY id DESC
             LIMIT $1`
          : `SELECT id, title, body, COALESCE(categories, ARRAY[]::text[]) AS categories
             FROM article
             WHERE token_statistics IS NULL
             ORDER BY id DESC
             LIMIT $1`;
        if (cursor) params.push(cursor);

        const { rows } = await client.query<ArticleRow>(sql, params);

        if (rows.length === 0) break;
        const ids: string[] = [];
        const statistics: string[] = [];

        for (const r of rows) {
          ids.push(r.id);
          statistics.push(
            JSON.stringify(
              computeTokenStatistics({
                body: r.body,
                categories: r.categories,
                title: r.title,
              }),
            ),
          );
        }

        console.log(`Apply updates in transactional sub-batches...`);
        for (let i = 0; i < ids.length; i += this.batchSize) {
          const idsChunk = ids.slice(i, i + this.batchSize);
          const statsChunk = statistics.slice(i, i + this.batchSize);

          if (idsChunk.length === 0) continue;

          try {
            await client.query("BEGIN");
            await client.query(
              `UPDATE article AS a
               SET token_statistics = u.token_statistics, updated_at = NOW()
               FROM (
                SELECT 
                  UNNEST($1::uuid[]) AS id,
                  (UNNEST($2::text[]))::jsonb AS token_statistics
               ) AS u
               WHERE a.id = u.id`,
              [idsChunk, statsChunk],
            );
            await client.query("COMMIT");
            console.log(`Updated batch: size=${idsChunk.length}`);
          } catch (e) {
            try {
              await client.query("ROLLBACK");
            } catch {}
            throw e;
          }
        }

        // advance cursor to the lowest id in this page (since we order DESC)
        cursor = rows[rows.length - 1]!.id;
        console.log(`Processed page: updated=${ids.length}`);
        console.log(`Advancing cursor to id < ${cursor}`);
      }
    } finally {
      client.release();
    }
  }

  async close() {
    await this.db.end();
  }
}

async function main() {
  const engine = new Engine(config.database.url);

  try {
    await engine.synchronize();
    console.log("Token statistics computation completed successfully");
    process.exit(0);
  } finally {
    await engine.close();
  }
}

main().catch((err) => {
  console.error(err?.message ?? err);
  process.exit(1);
});
