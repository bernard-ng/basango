import { Skeleton } from "../skeleton";
import { TableBody, TableCell, TableRow } from "../table";

type DataTableRowsSkeletonProps = {
  columns: number;
  rows?: number;
};

export function DataTableRowsSkeleton({ columns, rows = 10 }: DataTableRowsSkeletonProps) {
  return (
    <TableBody>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }).map((_, cellIndex) => (
            <TableCell key={cellIndex}>
              <Skeleton className="h-7 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}
