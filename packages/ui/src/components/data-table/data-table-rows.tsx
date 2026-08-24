import { type ColumnDef, type Table as TanStackTable, flexRender } from "@tanstack/react-table";

import { TableBody, TableCell, TableRow } from "../table";
import { DataTableRowsSkeleton } from "./data-table-rows-skeleton";

type DataTableRowsProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  emptyDescription?: string;
  emptyTitle?: string;
  isLoading?: boolean;
  table: TanStackTable<TData>;
};

export function DataTableRows<TData, TValue>({
  columns,
  emptyDescription = "No data matches the current filters.",
  emptyTitle = "No results",
  isLoading = false,
  table,
}: DataTableRowsProps<TData, TValue>) {
  if (isLoading) {
    return <DataTableRowsSkeleton columns={columns.length} />;
  }

  const rows = table.getRowModel().rows;

  if (rows.length === 0) {
    return (
      <TableBody>
        <TableRow>
          <TableCell className="h-32 text-center" colSpan={columns.length}>
            <div className="flex flex-col gap-1">
              <span className="font-medium">{emptyTitle}</span>
              <span className="text-sm text-muted-foreground">{emptyDescription}</span>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody className="bg-background">
      {rows.map((row) => (
        <TableRow data-state={row.getIsSelected() ? "selected" : undefined} key={row.id}>
          {row.getVisibleCells().map((cell) => (
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
