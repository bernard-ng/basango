import type {
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import { type StoreApi, type UseBoundStore, create } from "zustand";
import { persist } from "zustand/middleware";

type TableState = {
  columnFilters: ColumnFiltersState;
  columnVisibility: VisibilityState;
  globalFilter: string;
  globalFilterInput: string;
  pagination: PaginationState;
  rowSelection: RowSelectionState;
  sorting: SortingState;
};

export type TableStore = TableState & {
  setColumnFilters: OnChangeFn<ColumnFiltersState>;
  setColumnVisibility: OnChangeFn<VisibilityState>;
  setGlobalFilter: OnChangeFn<string>;
  setGlobalFilterInput: OnChangeFn<string>;
  setPagination: OnChangeFn<PaginationState>;
  setRowSelection: OnChangeFn<RowSelectionState>;
  setSorting: OnChangeFn<SortingState>;
};

export type TableStateDefaults = Partial<TableState>;

type TableStoreApi = UseBoundStore<StoreApi<TableStore>>;

const defaultTableState: TableState = {
  columnFilters: [],
  columnVisibility: {},
  globalFilter: "",
  globalFilterInput: "",
  pagination: { pageIndex: 0, pageSize: 10 },
  rowSelection: {},
  sorting: [],
};

const storeCache = new Map<string, TableStoreApi>();

function resolveUpdater<TValue>(
  updater: TValue | ((previous: TValue) => TValue),
  previous: TValue,
): TValue {
  return typeof updater === "function"
    ? (updater as (previous: TValue) => TValue)(previous)
    : updater;
}

function resetPageIndex(pagination: PaginationState): PaginationState {
  return {
    ...pagination,
    pageIndex: 0,
  };
}

export function createTableStore(
  tableId: string,
  initialState: TableStateDefaults = {},
): TableStoreApi {
  const cachedStore = storeCache.get(tableId);

  if (cachedStore) {
    return cachedStore;
  }

  const defaults = {
    ...defaultTableState,
    ...initialState,
  };
  defaults.globalFilterInput = defaults.globalFilterInput || defaults.globalFilter;

  const store = create<TableStore>()(
    persist(
      (set) => ({
        ...defaults,
        setColumnFilters: (updater) =>
          set((state) => ({
            columnFilters: resolveUpdater(updater, state.columnFilters),
            pagination: resetPageIndex(state.pagination),
          })),
        setColumnVisibility: (updater) =>
          set((state) => ({
            columnVisibility: resolveUpdater(updater, state.columnVisibility),
          })),
        setGlobalFilter: (updater) =>
          set((state) => ({
            globalFilter: resolveUpdater(updater, state.globalFilter),
            globalFilterInput: resolveUpdater(updater, state.globalFilter),
            pagination: resetPageIndex(state.pagination),
          })),
        setGlobalFilterInput: (updater) =>
          set((state) => ({
            globalFilterInput: resolveUpdater(updater, state.globalFilterInput),
          })),
        setPagination: (updater) =>
          set((state) => ({
            pagination: resolveUpdater(updater, state.pagination),
          })),
        setRowSelection: (updater) =>
          set((state) => ({
            rowSelection: resolveUpdater(updater, state.rowSelection),
          })),
        setSorting: (updater) =>
          set((state) => ({
            pagination: resetPageIndex(state.pagination),
            sorting: resolveUpdater(updater, state.sorting),
          })),
      }),
      {
        name: `basango:${tableId}:table-state`,
        partialize: (state): TableState => ({
          columnFilters: state.columnFilters,
          columnVisibility: state.columnVisibility,
          globalFilter: state.globalFilter,
          globalFilterInput: state.globalFilterInput,
          pagination: state.pagination,
          rowSelection: state.rowSelection,
          sorting: state.sorting,
        }),
      },
    ),
  );

  storeCache.set(tableId, store);

  return store;
}

export function useTableStore(tableId: string, initialState?: TableStateDefaults) {
  return createTableStore(tableId, initialState)();
}
