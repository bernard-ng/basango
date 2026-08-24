import type { Column } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon } from "lucide-react";

import { Button } from "../button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu";

type DataTableColumnHeaderProps<TData, TValue> = {
  column: Column<TData, TValue>;
  title: string;
};

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span>{title}</span>;
  }

  const sortedDirection = column.getIsSorted();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button className="-ml-2" size="sm" variant="ghost" />}>
        <span>{title}</span>
        {sortedDirection === "desc" ? (
          <ArrowDownIcon />
        ) : sortedDirection === "asc" ? (
          <ArrowUpIcon />
        ) : (
          <ChevronsUpDownIcon />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <ArrowUpIcon />
          Sort ascending
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <ArrowDownIcon />
          Sort descending
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
