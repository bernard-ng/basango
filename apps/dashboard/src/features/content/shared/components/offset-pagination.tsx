import { Button } from "@basango/ui/components/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

type OffsetPaginationProps = {
  currentPage: number;
  isFetching?: boolean;
  itemLabel: string;
  onPageChange: (page: number) => void;
  pageCount: number;
  total: number;
};

export function OffsetPagination({
  currentPage,
  isFetching = false,
  itemLabel,
  onPageChange,
  pageCount,
  total,
}: OffsetPaginationProps) {
  const pluralizedLabel = total === 1 ? itemLabel : `${itemLabel}s`;

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className="flex flex-col gap-3 rounded-lg border bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p className="text-sm text-muted-foreground">
        {total.toLocaleString()} {pluralizedLabel} · page {currentPage} of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <Button
          aria-label="Previous page"
          disabled={currentPage <= 1 || isFetching}
          onClick={() => onPageChange(currentPage - 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          <ChevronLeftIcon data-icon="inline-start" />
          Previous
        </Button>
        <Button
          aria-label="Next page"
          disabled={currentPage >= pageCount || isFetching}
          onClick={() => onPageChange(currentPage + 1)}
          size="sm"
          type="button"
          variant="outline"
        >
          Next
          <ChevronRightIcon data-icon="inline-end" />
        </Button>
      </div>
    </nav>
  );
}
