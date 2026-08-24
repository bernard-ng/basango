"use client";

import { type ColumnDef, type Row, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { type ReactNode, useMemo } from "react";

import { cn } from "../../lib/utils";
import { type TableStateDefaults, useTableStore } from "../../stores/table-store";
import { Table } from "../table";
import { DataTableHeader } from "./data-table-header";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableRows } from "./data-table-rows";
import type { DataTableToolbarProps } from "./data-table-toolbar";

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data?: TData[];
  emptyDescription?: string;
  emptyTitle?: string;
  getRowId?: (originalRow: TData, index: number, parent?: Row<TData>) => string;
  height?: string;
  initialState?: TableStateDefaults;
  loading?: boolean;
  pageCount?: number;
  rowCount?: number;
  tableId: string;
  toolbar?: (props: DataTableToolbarProps<TData>) => ReactNode;
};

const emptyData: never[] = [];

export function DataTable<TData, TValue>({
  columns,
  data = emptyData,
  emptyDescription,
  emptyTitle,
  getRowId,
  height = "h-[32rem]",
  initialState,
  loading = false,
  pageCount,
  rowCount,
  tableId,
  toolbar: Toolbar,
}: DataTableProps<TData, TValue>) {
  const stableColumns = useMemo(() => columns, [columns]);
  const store = useTableStore(tableId, initialState);
  const table = useReactTable({
    columns: stableColumns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    onColumnFiltersChange: store.setColumnFilters,
    onColumnVisibilityChange: store.setColumnVisibility,
    onGlobalFilterChange: store.setGlobalFilter,
    onPaginationChange: store.setPagination,
    onRowSelectionChange: store.setRowSelection,
    onSortingChange: store.setSorting,
    pageCount: Math.max(pageCount ?? 1, 1),
    rowCount,
    state: {
      columnFilters: store.columnFilters,
      columnVisibility: store.columnVisibility,
      globalFilter: store.globalFilter,
      pagination: store.pagination,
      rowSelection: store.rowSelection,
      sorting: store.sorting,
    },
  });

  const isFiltered = Boolean(store.globalFilter) || store.columnFilters.length > 0;

  return (
    <div className="flex flex-col gap-4">
      {Toolbar?.({ store, table })}
      <Table
        containerClassName={cn(
          "w-full overflow-auto rounded-lg border bg-background shadow-xs",
          height,
          isFiltered && "border-2 border-dashed border-amber-500/80",
        )}
      >
        <DataTableHeader table={table} />
        <DataTableRows
          columns={stableColumns}
          emptyDescription={emptyDescription}
          emptyTitle={emptyTitle}
          isLoading={loading}
          table={table}
        />
      </Table>
      <DataTablePagination table={table} totalRows={rowCount} />
    </div>
  );
}
