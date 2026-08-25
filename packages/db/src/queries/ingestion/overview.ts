import { desc, sql } from "drizzle-orm";

import type { Database } from "#db/client";
import { ingestionAgents, ingestionRuns } from "#db/schema";

const AGENT_ONLINE_WINDOW_MS = 45_000;
const THROUGHPUT_BUCKETS = 10;
const THROUGHPUT_WINDOW_MS = 30 * 60 * 1000;

interface ThroughputBucket {
  [key: string]: unknown;
  articlesDelivered: number;
  articlesDiscovered: number;
  articlesPersisted: number;
  bucket: number;
}

export async function getIngestionOverview(db: Database) {
  const generatedAt = new Date();
  const [agents, runs, throughput] = await Promise.all([
    db.query.ingestionAgents.findMany({ orderBy: [desc(ingestionAgents.lastSeenAt)] }),
    db.query.ingestionRuns.findMany({
      limit: 24,
      orderBy: [desc(ingestionRuns.lastSignalAt)],
    }),
    getIngestionThroughput(db, generatedAt),
  ]);
  const now = generatedAt.getTime();

  return {
    agents: agents.map((agent) => {
      const online = now - agent.lastSeenAt.getTime() <= AGENT_ONLINE_WINDOW_MS;
      return {
        ...agent,
        online,
        state: online ? agent.state : "offline",
      };
    }),
    generatedAt,
    runs,
    throughput,
  };
}

async function getIngestionThroughput(db: Database, end: Date) {
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
