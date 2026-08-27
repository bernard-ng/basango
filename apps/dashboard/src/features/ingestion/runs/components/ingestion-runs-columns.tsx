import { Badge } from "@basango/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";

import { formatDuration, relativeTime, stateVariant } from "../../shared/ingestion-formatters";
import type { IngestionRun } from "../types";

export function createIngestionRunColumns(): ColumnDef<IngestionRun>[] {
  return [
    {
      accessorKey: "sourceId",
      cell: ({ row }) => (
        <div className="grid max-w-64 gap-0.5">
          <span className="truncate font-medium">{row.original.sourceId}</span>
          {row.original.error && (
            <span className="truncate text-xs text-destructive" title={row.original.error}>
              {row.original.error}
            </span>
          )}
        </div>
      ),
      header: "Source",
    },
    {
      accessorKey: "state",
      cell: ({ row }) => (
        <Badge variant={stateVariant(row.original.state)}>{row.original.state}</Badge>
      ),
      header: "Status",
    },
    {
      accessorKey: "agentId",
      cell: ({ row }) => (
        <span className="block max-w-44 truncate text-muted-foreground">
          {row.original.agentId}
        </span>
      ),
      header: "Agent",
    },
    {
      accessorKey: "articlesDiscovered",
      cell: ({ row }) => <MetricValue value={row.original.articlesDiscovered} />,
      header: "Discovered",
    },
    {
      accessorKey: "articlesProcessed",
      cell: ({ row }) => <MetricValue value={row.original.articlesProcessed} />,
      header: "Processed",
    },
    {
      accessorKey: "articlesPersisted",
      cell: ({ row }) => <MetricValue value={row.original.articlesPersisted} />,
      header: "Persisted",
    },
    {
      accessorKey: "articlesSkipped",
      cell: ({ row }) => <MetricValue value={row.original.articlesSkipped} />,
      header: "Skipped",
    },
    {
      accessorKey: "articlesDelivered",
      cell: ({ row }) => <MetricValue value={row.original.articlesDelivered} />,
      header: "Delivered",
    },
    {
      accessorKey: "articlesFailed",
      cell: ({ row }) => <MetricValue value={row.original.articlesFailed} />,
      header: "Failed",
    },
    {
      accessorKey: "durationMs",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{formatDuration(row.original.durationMs)}</span>
      ),
      header: "Duration",
    },
    {
      accessorKey: "lastSignalAt",
      cell: ({ row }) => (
        <time className="text-xs text-muted-foreground">
          {relativeTime(row.original.lastSignalAt)}
        </time>
      ),
      header: "Updated",
    },
  ];
}

function MetricValue({ value }: { value: number | null }) {
  return <span className="block text-right font-mono tabular-nums">{value ?? "—"}</span>;
}
