import { desc } from "drizzle-orm";

import type { Database } from "#db/client";
import { ingestionRuns } from "#db/schema";

const SUMMARY_RUN_LIMIT = 24;

type IngestionTotals = {
  delivered: number;
  discovered: number;
  failed: number;
  persisted: number;
  processed: number;
  skipped: number;
};

const EMPTY_TOTALS: IngestionTotals = {
  delivered: 0,
  discovered: 0,
  failed: 0,
  persisted: 0,
  processed: 0,
  skipped: 0,
};

export async function getIngestionSummary(db: Database) {
  const runs = await db.query.ingestionRuns.findMany({
    limit: SUMMARY_RUN_LIMIT,
    orderBy: [desc(ingestionRuns.lastSignalAt)],
  });
  const activeRuns = runs.filter((run) => run.state === "preparing" || run.state === "running");
  const completedRuns = runs.filter((run) => run.state === "completed");
  const failedRuns = runs.filter((run) => run.state === "failed");
  const totals = runs.reduce(
    (current, run) => ({
      delivered: current.delivered + run.articlesDelivered,
      discovered: current.discovered + run.articlesDiscovered,
      failed: current.failed + run.articlesFailed,
      persisted: current.persisted + run.articlesPersisted,
      processed: current.processed + (run.articlesProcessed ?? 0),
      skipped: current.skipped + (run.articlesSkipped ?? 0),
    }),
    { ...EMPTY_TOTALS },
  );
  const terminalRunsCount = completedRuns.length + failedRuns.length;

  return {
    activeRunsCount: activeRuns.length,
    completedRunsCount: completedRuns.length,
    failedRunsCount: failedRuns.length,
    runDurations: runs
      .filter((run) => run.durationMs !== null)
      .slice(0, 12)
      .map((run) => ({
        durationMs: run.durationMs ?? 0,
        lastSignalAt: run.lastSignalAt,
        sourceId: run.sourceId,
      })),
    successRate:
      terminalRunsCount === 0 ? 100 : Math.round((completedRuns.length / terminalRunsCount) * 100),
    totals,
  };
}
