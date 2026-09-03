import { count, inArray, sql } from "drizzle-orm";

import type { Database } from "#db/client";
import { ingestionActivities, ingestionAgents, ingestionRuns } from "#db/schema";

const DEFAULT_CLEANUP_BATCH_SIZE = 5_000;

export type IngestionLifecycleCleanupResult = {
  deletedActivityCount: number;
  deletedAgentCount: number;
  deletedRunCount: number;
};

type PruneIngestionLifecycleOptions = {
  batchSize?: number;
  cutoff: Date;
};

type RunCleanupBatch = {
  deletedActivityCount: number;
  deletedRunCount: number;
};

type CleanupCountBatch = {
  deletedCount: number;
};

export async function resetIngestionLifecycle(
  db: Database,
): Promise<IngestionLifecycleCleanupResult> {
  return db.transaction(async (tx) => {
    const [activityCount] = await tx
      .select({ value: count(ingestionActivities.id) })
      .from(ingestionActivities);
    const [agentCount] = await tx
      .select({ value: count(ingestionAgents.id) })
      .from(ingestionAgents);
    const [runCount] = await tx.select({ value: count(ingestionRuns.id) }).from(ingestionRuns);

    await tx.execute(
      sql`TRUNCATE TABLE ${ingestionActivities}, ${ingestionRuns}, ${ingestionAgents}`,
    );

    return {
      deletedActivityCount: activityCount?.value ?? 0,
      deletedAgentCount: agentCount?.value ?? 0,
      deletedRunCount: runCount?.value ?? 0,
    };
  });
}

export async function pruneIngestionLifecycle(
  db: Database,
  options: PruneIngestionLifecycleOptions,
): Promise<IngestionLifecycleCleanupResult> {
  const batchSize = options.batchSize ?? DEFAULT_CLEANUP_BATCH_SIZE;
  const result: IngestionLifecycleCleanupResult = {
    deletedActivityCount: 0,
    deletedAgentCount: 0,
    deletedRunCount: 0,
  };

  for (;;) {
    const batch = await deleteExpiredRuns(db, options.cutoff, batchSize);
    result.deletedActivityCount += batch.deletedActivityCount;
    result.deletedRunCount += batch.deletedRunCount;

    if (batch.deletedRunCount < batchSize) {
      break;
    }
  }

  for (;;) {
    const deletedCount = await deleteExpiredActivities(db, options.cutoff, batchSize);
    result.deletedActivityCount += deletedCount;

    if (deletedCount < batchSize) {
      break;
    }
  }

  for (;;) {
    const deletedCount = await deleteExpiredAgents(db, options.cutoff, batchSize);
    result.deletedAgentCount += deletedCount;

    if (deletedCount < batchSize) {
      break;
    }
  }

  return result;
}

async function deleteExpiredRuns(
  db: Database,
  cutoff: Date,
  batchSize: number,
): Promise<RunCleanupBatch> {
  const result = await db.execute<RunCleanupBatch>(sql`
    WITH candidate_runs AS (
      SELECT ${ingestionRuns.id}
      FROM ${ingestionRuns}
      WHERE ${ingestionRuns.lastSignalAt} < ${cutoff}
        AND ${ingestionRuns.state} IN ('completed', 'failed')
      ORDER BY ${ingestionRuns.lastSignalAt}, ${ingestionRuns.id}
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    ),
    released_agents AS (
      UPDATE ${ingestionAgents}
      SET "active_run_id" = NULL,
          "state" = 'idle'
      WHERE ${inArray(ingestionAgents.activeRunId, sql`(SELECT id FROM candidate_runs)`)}
      RETURNING ${ingestionAgents.id}
    ),
    deleted_runs AS (
      DELETE FROM ${ingestionRuns}
      WHERE ${inArray(ingestionRuns.id, sql`(SELECT id FROM candidate_runs)`)}
      RETURNING ${ingestionRuns.id}
    ),
    deleted_activities AS (
      DELETE FROM ${ingestionActivities}
      WHERE ${inArray(ingestionActivities.runId, sql`(SELECT id FROM deleted_runs)`)}
      RETURNING ${ingestionActivities.id}
    )
    SELECT
      (SELECT COUNT(*)::int FROM deleted_activities) AS "deletedActivityCount",
      (SELECT COUNT(*)::int FROM deleted_runs) AS "deletedRunCount"
  `);

  return result.rows[0] ?? { deletedActivityCount: 0, deletedRunCount: 0 };
}

async function deleteExpiredActivities(db: Database, cutoff: Date, batchSize: number) {
  const result = await db.execute<CleanupCountBatch>(sql`
    WITH candidate_activities AS (
      SELECT ${ingestionActivities.id}
      FROM ${ingestionActivities}
      WHERE ${ingestionActivities.occurredAt} < ${cutoff}
      ORDER BY ${ingestionActivities.occurredAt}, ${ingestionActivities.id}
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    ),
    deleted_activities AS (
      DELETE FROM ${ingestionActivities}
      WHERE ${inArray(ingestionActivities.id, sql`(SELECT id FROM candidate_activities)`)}
      RETURNING ${ingestionActivities.id}
    )
    SELECT COUNT(*)::int AS "deletedCount" FROM deleted_activities
  `);

  return result.rows[0]?.deletedCount ?? 0;
}

async function deleteExpiredAgents(db: Database, cutoff: Date, batchSize: number) {
  const result = await db.execute<CleanupCountBatch>(sql`
    WITH candidate_agents AS (
      SELECT ${ingestionAgents.id}
      FROM ${ingestionAgents}
      WHERE ${ingestionAgents.lastSeenAt} < ${cutoff}
        AND NOT EXISTS (
          SELECT 1
          FROM ${ingestionRuns}
          WHERE ${ingestionRuns.agentId} = ${ingestionAgents.id}
            AND ${ingestionRuns.state} IN ('preparing', 'running')
        )
      ORDER BY ${ingestionAgents.lastSeenAt}, ${ingestionAgents.id}
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    ),
    deleted_agents AS (
      DELETE FROM ${ingestionAgents}
      WHERE ${inArray(ingestionAgents.id, sql`(SELECT id FROM candidate_agents)`)}
      RETURNING ${ingestionAgents.id}
    )
    SELECT COUNT(*)::int AS "deletedCount" FROM deleted_agents
  `);

  return result.rows[0]?.deletedCount ?? 0;
}
