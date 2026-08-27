import {
  INGESTION_RUN_SORT_FIELDS,
  INGESTION_RUN_STATES,
  type IngestionRunState,
  type IngestionRunsQuery,
} from "@basango/domain/models";
import type { useTableStore } from "@basango/ui/stores/table-store";

export function buildIngestionRunsQuery(
  store: ReturnType<typeof useTableStore>,
  sourceId?: string,
): IngestionRunsQuery {
  const query = store.globalFilter.trim();
  const states = resolveIngestionRunStates(
    store.columnFilters.find((filter) => filter.id === "state")?.value,
  );
  const sorting = store.sorting[0];
  const filters =
    query || sourceId || states.length > 0
      ? { query: query || undefined, sourceId, states }
      : undefined;
  const sort =
    sorting && isSortField(sorting.id)
      ? { direction: sorting.desc ? ("desc" as const) : ("asc" as const), field: sorting.id }
      : undefined;

  return {
    filters,
    page: {
      current: store.pagination.pageIndex + 1,
      limit: store.pagination.pageSize,
    },
    sort,
  };
}

export function resolveIngestionRunStates(value: unknown): IngestionRunState[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRunState);
}

function isRunState(value: unknown): value is IngestionRunState {
  return typeof value === "string" && INGESTION_RUN_STATES.includes(value as IngestionRunState);
}

function isSortField(value: string): value is (typeof INGESTION_RUN_SORT_FIELDS)[number] {
  return INGESTION_RUN_SORT_FIELDS.includes(value as (typeof INGESTION_RUN_SORT_FIELDS)[number]);
}
