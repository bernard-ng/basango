import type { CloseIngestionRuns, IngestionRunsQuery } from "@basango/domain/models";
import type { SQL } from "drizzle-orm";
import { and, asc, count, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";

import type { Database } from "#db/client";
import { ingestionAgents, ingestionRuns } from "#db/schema";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MANUAL_FAILURE_MESSAGE = "Manually marked as failed from the dashboard.";

const sortColumns = {
  agentId: ingestionRuns.agentId,
  articlesDelivered: ingestionRuns.articlesDelivered,
  articlesDiscovered: ingestionRuns.articlesDiscovered,
  articlesFailed: ingestionRuns.articlesFailed,
  articlesPersisted: ingestionRuns.articlesPersisted,
  articlesProcessed: ingestionRuns.articlesProcessed,
  articlesSkipped: ingestionRuns.articlesSkipped,
  durationMs: ingestionRuns.durationMs,
  lastSignalAt: ingestionRuns.lastSignalAt,
  sourceId: ingestionRuns.sourceId,
  state: ingestionRuns.state,
} satisfies Record<
  NonNullable<IngestionRunsQuery["sort"]>["field"],
  (typeof ingestionRuns)[keyof typeof ingestionRuns]
>;

export async function listIngestionRuns(db: Database, params: IngestionRunsQuery) {
  const currentPage = params.page?.current ?? DEFAULT_PAGE;
  const pageSize = params.page?.limit ?? DEFAULT_PAGE_SIZE;
  const offset = (currentPage - 1) * pageSize;
  const where = buildRunsFilter(params);
  const sort = params.sort ?? { direction: "desc" as const, field: "lastSignalAt" as const };
  const sortColumn = sortColumns[sort.field];
  const orderBy = sort.direction === "asc" ? asc(sortColumn) : desc(sortColumn);

  const [items, total] = await Promise.all([
    db.select().from(ingestionRuns).where(where).orderBy(orderBy).limit(pageSize).offset(offset),
    db
      .select({ value: count(ingestionRuns.id) })
      .from(ingestionRuns)
      .where(where)
      .then((rows) => rows[0]?.value ?? 0),
  ]);

  return {
    items,
    pagination: {
      current: currentPage,
      limit: pageSize,
      offset,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      total,
    },
  };
}

export async function closeIngestionRuns(db: Database, params: CloseIngestionRuns) {
  const completedAt = new Date();

  return db.transaction(async (tx) => {
    const releasedAgents = await tx
      .update(ingestionAgents)
      .set({ activeRunId: null, state: "idle" })
      .where(inArray(ingestionAgents.activeRunId, params.runIds))
      .returning({ id: ingestionAgents.id });
    const updatedRuns = await tx
      .update(ingestionRuns)
      .set({
        completedAt: sql`COALESCE(${ingestionRuns.completedAt}, ${completedAt})`,
        durationMs: sql`COALESCE(${ingestionRuns.durationMs}, GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (${completedAt} - COALESCE(${ingestionRuns.startedAt}, ${ingestionRuns.createdAt}))) * 1000)::bigint))`,
        ...(params.state === "failed"
          ? { error: sql`COALESCE(${ingestionRuns.error}, ${MANUAL_FAILURE_MESSAGE})` }
          : { error: null }),
        lastSignalAt: completedAt,
        state: params.state,
      })
      .where(and(inArray(ingestionRuns.id, params.runIds), ne(ingestionRuns.state, params.state)))
      .returning({ id: ingestionRuns.id });
    const updatedRunIds = updatedRuns.map((run) => run.id);

    return {
      releasedAgentCount: releasedAgents.length,
      runIds: updatedRunIds,
      unchangedCount: params.runIds.length - updatedRunIds.length,
      updatedCount: updatedRunIds.length,
    };
  });
}

function buildRunsFilter(params: IngestionRunsQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const query = params.filters?.query;
  const sourceId = params.filters?.sourceId;
  const states = params.filters?.states;

  if (sourceId) {
    conditions.push(eq(ingestionRuns.sourceId, sourceId));
  }

  if (query) {
    const pattern = `%${query}%`;
    const searchCondition = or(
      ilike(ingestionRuns.sourceId, pattern),
      ilike(ingestionRuns.agentId, pattern),
      ilike(ingestionRuns.error, pattern),
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (states && states.length > 0) {
    conditions.push(inArray(ingestionRuns.state, states));
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}
