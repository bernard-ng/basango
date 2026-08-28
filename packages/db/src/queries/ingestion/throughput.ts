import { sql } from "drizzle-orm";

import type { Database } from "#db/client";

const THROUGHPUT_BUCKETS = 10;
const THROUGHPUT_WINDOW_MS = 30 * 60 * 1000;
const RUN_THROUGHPUT_BUCKETS = 12;

type ThroughputBucket = {
  [key: string]: unknown;
  articlesDelivered: number;
  articlesDiscovered: number;
  articlesPersisted: number;
  bucket: number;
};

export async function getIngestionThroughput(db: Database) {
  const end = new Date();
  const start = new Date(end.getTime() - THROUGHPUT_WINDOW_MS);
  const bucketSizeMs = THROUGHPUT_WINDOW_MS / THROUGHPUT_BUCKETS;
  const result = await db.execute<ThroughputBucket>(sql`
    WITH bounds AS (
      SELECT
        timezone('UTC', ${start}::timestamptz) AS start_at,
        timezone('UTC', ${end}::timestamptz) AS end_at,
        ${bucketSizeMs}::double precision AS bucket_ms
    ),
    recent AS (
      SELECT
        activity.id,
        activity.run_id,
        activity.occurred_at,
        COALESCE((activity.data -> 'metrics' ->> 'articlesDelivered')::int, 0) AS delivered,
        COALESCE((activity.data -> 'metrics' ->> 'articlesDiscovered')::int, 0) AS discovered,
        COALESCE((activity.data -> 'metrics' ->> 'articlesPersisted')::int, 0) AS persisted
      FROM ingestion_activity activity
      CROSS JOIN bounds
      WHERE activity.run_id IS NOT NULL
        AND activity.occurred_at >= bounds.start_at
        AND activity.occurred_at <= bounds.end_at
        AND activity.data ? 'metrics'
    ),
    baseline AS (
      SELECT DISTINCT ON (activity.run_id)
        activity.id,
        activity.run_id,
        activity.occurred_at,
        COALESCE((activity.data -> 'metrics' ->> 'articlesDelivered')::int, 0) AS delivered,
        COALESCE((activity.data -> 'metrics' ->> 'articlesDiscovered')::int, 0) AS discovered,
        COALESCE((activity.data -> 'metrics' ->> 'articlesPersisted')::int, 0) AS persisted
      FROM ingestion_activity activity
      INNER JOIN (SELECT DISTINCT run_id FROM recent) recent_runs USING (run_id)
      CROSS JOIN bounds
      WHERE activity.occurred_at < bounds.start_at
        AND activity.data ? 'metrics'
      ORDER BY activity.run_id, activity.occurred_at DESC, activity.id DESC
    ),
    signals AS (
      SELECT * FROM baseline
      UNION ALL
      SELECT * FROM recent
    ),
    deltas AS (
      SELECT
        occurred_at,
        GREATEST(
          delivered - LAG(delivered, 1, 0) OVER run_signals,
          0
        ) AS delivered,
        GREATEST(
          discovered - LAG(discovered, 1, 0) OVER run_signals,
          0
        ) AS discovered,
        GREATEST(
          persisted - LAG(persisted, 1, 0) OVER run_signals,
          0
        ) AS persisted
      FROM signals
      WINDOW run_signals AS (PARTITION BY run_id ORDER BY occurred_at, id)
    ),
    bucketed AS (
      SELECT
        LEAST(
          ${THROUGHPUT_BUCKETS - 1},
          GREATEST(
            0,
            FLOOR(
              EXTRACT(EPOCH FROM (deltas.occurred_at - bounds.start_at)) * 1000
              / bounds.bucket_ms
            )::int
          )
        ) AS bucket,
        SUM(deltas.delivered)::int AS delivered,
        SUM(deltas.discovered)::int AS discovered,
        SUM(deltas.persisted)::int AS persisted
      FROM deltas
      CROSS JOIN bounds
      WHERE deltas.occurred_at >= bounds.start_at
      GROUP BY 1
    )
    SELECT
      series.bucket,
      COALESCE(bucketed.delivered, 0)::int AS "articlesDelivered",
      COALESCE(bucketed.discovered, 0)::int AS "articlesDiscovered",
      COALESCE(bucketed.persisted, 0)::int AS "articlesPersisted"
    FROM generate_series(0, ${THROUGHPUT_BUCKETS - 1}) AS series(bucket)
    LEFT JOIN bucketed USING (bucket)
    ORDER BY series.bucket
  `);

  return result.rows.map((bucket) => ({
    articlesDelivered: bucket.articlesDelivered,
    articlesDiscovered: bucket.articlesDiscovered,
    articlesPersisted: bucket.articlesPersisted,
    occurredAt: new Date(start.getTime() + bucket.bucket * bucketSizeMs),
  }));
}

type RunThroughputWindow = {
  end: Date;
  runId: string;
  start: Date;
};

export async function getIngestionRunThroughput(db: Database, window: RunThroughputWindow) {
  const durationMs = Math.max(1, window.end.getTime() - window.start.getTime());
  const bucketSizeMs = durationMs / RUN_THROUGHPUT_BUCKETS;
  const result = await db.execute<ThroughputBucket>(sql`
    WITH signals AS (
      SELECT
        activity.id,
        activity.occurred_at,
        COALESCE((activity.data -> 'metrics' ->> 'articlesDelivered')::int, 0) AS delivered,
        COALESCE((activity.data -> 'metrics' ->> 'articlesDiscovered')::int, 0) AS discovered,
        COALESCE((activity.data -> 'metrics' ->> 'articlesPersisted')::int, 0) AS persisted
      FROM ingestion_activity activity
      WHERE activity.run_id = ${window.runId}::uuid
        AND activity.data ? 'metrics'
    ),
    deltas AS (
      SELECT
        occurred_at,
        GREATEST(delivered - LAG(delivered, 1, 0) OVER ordered_signals, 0) AS delivered,
        GREATEST(discovered - LAG(discovered, 1, 0) OVER ordered_signals, 0) AS discovered,
        GREATEST(persisted - LAG(persisted, 1, 0) OVER ordered_signals, 0) AS persisted
      FROM signals
      WINDOW ordered_signals AS (ORDER BY occurred_at, id)
    ),
    bucketed AS (
      SELECT
        LEAST(
          ${RUN_THROUGHPUT_BUCKETS - 1},
          GREATEST(
            0,
            FLOOR(
              EXTRACT(EPOCH FROM (deltas.occurred_at - ${window.start}::timestamptz)) * 1000
              / ${bucketSizeMs}::double precision
            )::int
          )
        ) AS bucket,
        SUM(deltas.delivered)::int AS delivered,
        SUM(deltas.discovered)::int AS discovered,
        SUM(deltas.persisted)::int AS persisted
      FROM deltas
      GROUP BY 1
    )
    SELECT
      series.bucket,
      COALESCE(bucketed.delivered, 0)::int AS "articlesDelivered",
      COALESCE(bucketed.discovered, 0)::int AS "articlesDiscovered",
      COALESCE(bucketed.persisted, 0)::int AS "articlesPersisted"
    FROM generate_series(0, ${RUN_THROUGHPUT_BUCKETS - 1}) AS series(bucket)
    LEFT JOIN bucketed USING (bucket)
    ORDER BY series.bucket
  `);

  return result.rows.map((bucket) => ({
    articlesDelivered: bucket.articlesDelivered,
    articlesDiscovered: bucket.articlesDiscovered,
    articlesPersisted: bucket.articlesPersisted,
    occurredAt: new Date(window.start.getTime() + bucket.bucket * bucketSizeMs),
  }));
}
