import { Badge } from "@basango/ui/components/badge";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import { formatDuration } from "../../shared/ingestion-formatters";
import type { IngestionRunActivity } from "../types";

const eventLabels: Record<IngestionRunActivity["type"], string> = {
  "agent.heartbeat": "Agent heartbeat",
  "agent.reset": "Agent reset",
  "run.completed": "Completed",
  "run.failed": "Failed",
  "run.preparing": "Preparing",
  "run.progress": "Progress",
  "run.started": "Started",
};

export function createIngestionRunActivityColumns(): ColumnDef<IngestionRunActivity>[] {
  return [
    {
      accessorKey: "type",
      cell: ({ row }) => (
        <Badge variant={eventVariant(row.original.type)}>{eventLabels[row.original.type]}</Badge>
      ),
      enableSorting: false,
      header: "Event",
    },
    {
      accessorKey: "occurredAt",
      cell: ({ row }) => (
        <time className="text-xs text-muted-foreground tabular-nums">
          {format(new Date(row.original.occurredAt), "MMM d, yyyy HH:mm:ss")}
        </time>
      ),
      enableSorting: false,
      header: "Occurred",
    },
    metricColumn("articlesDiscovered", "Discovered"),
    metricColumn("articlesProcessed", "Processed"),
    metricColumn("articlesPersisted", "Persisted"),
    metricColumn("articlesSkipped", "Skipped"),
    metricColumn("articlesDelivered", "Delivered"),
    metricColumn("articlesFailed", "Failed"),
    {
      accessorKey: "durationMs",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.durationMs === null ? "—" : formatDuration(row.original.durationMs)}
        </span>
      ),
      enableSorting: false,
      header: "Duration",
    },
    {
      accessorKey: "error",
      cell: ({ row }) => (
        <span
          className="block max-w-72 truncate text-destructive"
          title={row.original.error ?? undefined}
        >
          {row.original.error ?? "—"}
        </span>
      ),
      enableSorting: false,
      header: "Details",
    },
  ];
}

function metricColumn(
  accessorKey: keyof Pick<
    IngestionRunActivity,
    | "articlesDelivered"
    | "articlesDiscovered"
    | "articlesFailed"
    | "articlesPersisted"
    | "articlesProcessed"
    | "articlesSkipped"
  >,
  header: string,
): ColumnDef<IngestionRunActivity> {
  return {
    accessorKey,
    cell: ({ row }) => (
      <span className="block text-right font-mono tabular-nums">
        {row.original[accessorKey] ?? "—"}
      </span>
    ),
    enableSorting: false,
    header,
  };
}

function eventVariant(type: IngestionRunActivity["type"]) {
  if (type === "run.failed") {
    return "destructive" as const;
  }

  if (type === "run.completed") {
    return "default" as const;
  }

  return "secondary" as const;
}
