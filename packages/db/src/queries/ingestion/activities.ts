import type {
  IngestionAgentActivitiesQuery,
  IngestionRunActivitiesQuery,
} from "@basango/domain/models";
import type { SQL } from "drizzle-orm";
import { count, desc, eq, sql } from "drizzle-orm";

import type { Database } from "#db/client";
import { ingestionActivities } from "#db/schema";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

type ActivityPage = {
  current?: number;
  limit?: number;
};

export function listIngestionRunActivities(db: Database, params: IngestionRunActivitiesQuery) {
  return listIngestionActivities(db, params.page, eq(ingestionActivities.runId, params.runId));
}

export function listIngestionAgentActivities(db: Database, params: IngestionAgentActivitiesQuery) {
  return listIngestionActivities(db, params.page, eq(ingestionActivities.agentId, params.agentId));
}

async function listIngestionActivities(db: Database, page: ActivityPage | undefined, where: SQL) {
  const currentPage = page?.current ?? DEFAULT_PAGE;
  const pageSize = page?.limit ?? DEFAULT_PAGE_SIZE;
  const offset = (currentPage - 1) * pageSize;
  const [items, total] = await Promise.all([
    db
      .select({
        agentId: ingestionActivities.agentId,
        articlesDelivered: metricValue("articlesDelivered"),
        articlesDiscovered: metricValue("articlesDiscovered"),
        articlesFailed: metricValue("articlesFailed"),
        articlesPersisted: metricValue("articlesPersisted"),
        articlesProcessed: metricValue("articlesProcessed"),
        articlesSkipped: metricValue("articlesSkipped"),
        durationMs: sql<
          number | null
        >`CASE WHEN ${ingestionActivities.data} ? 'durationMs' THEN (${ingestionActivities.data} ->> 'durationMs')::double precision ELSE NULL END`,
        error: sql<string | null>`${ingestionActivities.data} ->> 'error'`,
        id: ingestionActivities.id,
        occurredAt: ingestionActivities.occurredAt,
        runId: ingestionActivities.runId,
        sourceId: ingestionActivities.sourceId,
        type: ingestionActivities.type,
      })
      .from(ingestionActivities)
      .where(where)
      .orderBy(desc(ingestionActivities.occurredAt), desc(ingestionActivities.id))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count(ingestionActivities.id) })
      .from(ingestionActivities)
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

function metricValue(key: string) {
  return sql<
    number | null
  >`CASE WHEN ${ingestionActivities.data} ? 'metrics' THEN (${ingestionActivities.data} -> 'metrics' ->> ${key})::int ELSE NULL END`;
}
