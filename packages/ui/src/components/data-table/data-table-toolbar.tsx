import type { Table } from "@tanstack/react-table";
import { type ReactNode, useEffect, useRef } from "react";

import type { TableStore } from "../../stores/table-store";
import { DataTableFilterInput } from "./data-table-filter-input";

export type DataTableToolbarProps<TData> = {
  children?: ReactNode;
  disableFilter?: boolean;
  filterDebounceMs?: number;
  filterPlaceholder?: string;
  filters?: (table: Table<TData>) => ReactNode;
  store: Pick<
    TableStore,
    "globalFilter" | "globalFilterInput" | "setGlobalFilter" | "setGlobalFilterInput"
  >;
  table: Table<TData>;
};

export function DataTableToolbar<TData>({
  children,
  disableFilter = false,
  filterDebounceMs = 350,
  filterPlaceholder = "Search…",
  filters,
  store,
  table,
}: DataTableToolbarProps<TData>) {
  const filterTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(
    () => () => {
      if (filterTimeout.current) {
        clearTimeout(filterTimeout.current);
      }
    },
    [],
  );

  function handleGlobalFilterChange(nextGlobalFilter: string) {
    store.setGlobalFilterInput(nextGlobalFilter);
    if (filterTimeout.current) {
      clearTimeout(filterTimeout.current);
    }
    filterTimeout.current = setTimeout(() => {
      store.setGlobalFilter(nextGlobalFilter);
    }, filterDebounceMs);
  }

  function resetFilters() {
    if (filterTimeout.current) {
      clearTimeout(filterTimeout.current);
    }
    table.resetColumnFilters();
    store.setGlobalFilter("");
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {!disableFilter && (
          <>
            <DataTableFilterInput
              isFiltered={table.getState().columnFilters.length > 0 || Boolean(store.globalFilter)}
              onChange={handleGlobalFilterChange}
              onReset={resetFilters}
              placeholder={filterPlaceholder}
              value={store.globalFilterInput}
            />
            {filters?.(table)}
          </>
        )}
      </div>
      {children && <div className="flex items-center justify-end gap-2">{children}</div>}
    </div>
  );
}
