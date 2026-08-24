import { type Table as TanStackTable, flexRender } from "@tanstack/react-table";

import { TableHead, TableHeader, TableRow } from "../table";
import { DataTableColumnHeader } from "./data-table-column-header";

type DataTableHeaderProps<TData> = {
  table: TanStackTable<TData>;
};

export function DataTableHeader<TData>({ table }: DataTableHeaderProps<TData>) {
  return (
    <TableHeader className="sticky top-0 z-10 bg-muted">
      {table.getHeaderGroups().map((headerGroup) => (
        <TableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => (
            <TableHead key={header.id}>
              {!header.isPlaceholder &&
                (typeof header.column.columnDef.header === "string" ? (
                  <DataTableColumnHeader
                    column={header.column}
                    title={header.column.columnDef.header}
                  />
                ) : (
                  flexRender(header.column.columnDef.header, header.getContext())
                ))}
            </TableHead>
          ))}
        </TableRow>
      ))}
    </TableHeader>
  );
}
