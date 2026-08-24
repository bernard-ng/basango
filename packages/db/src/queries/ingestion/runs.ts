import type { IngestionRunsQuery } from "@basango/domain/models";
import type { SQL } from "drizzle-orm";
import { and, asc, count, desc, ilike, inArray, or } from "drizzle-orm";

import type { Database } from "#db/client";
import { ingestionRuns } from "#db/schema";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;

const sortColumns = {
  agentId: ingestionRuns.agentId,
  articlesDelivered: ingestionRuns.articlesDelivered,
  articlesDiscovered: ingestionRuns.articlesDiscovered,
  articlesFailed: ingestionRuns.articlesFailed,
  articlesPersisted: ingestionRuns.articlesPersisted,
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

function buildRunsFilter(params: IngestionRunsQuery): SQL | undefined {
  const conditions: SQL[] = [];
  const query = params.filters?.query;
  const states = params.filters?.states;

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
