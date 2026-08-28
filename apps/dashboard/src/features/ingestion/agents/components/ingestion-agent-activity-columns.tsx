import { Badge } from "@basango/ui/components/badge";
import { Link } from "@tanstack/react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

import type { IngestionAgentActivity } from "../types";

const eventLabels: Record<IngestionAgentActivity["type"], string> = {
  "agent.heartbeat": "Heartbeat",
  "agent.reset": "Reset",
  "run.completed": "Completed",
  "run.failed": "Failed",
  "run.preparing": "Preparing",
  "run.progress": "Progress",
  "run.started": "Started",
};

export function createIngestionAgentActivityColumns(): ColumnDef<IngestionAgentActivity>[] {
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
    {
      accessorKey: "sourceId",
      cell: ({ row }) => row.original.sourceId ?? "—",
      enableSorting: false,
      header: "Source",
    },
    {
      accessorKey: "runId",
      cell: ({ row }) =>
        row.original.runId ? (
          <Link
            className="block max-w-36 truncate font-mono text-xs underline-offset-4 hover:underline"
            params={{ runId: row.original.runId }}
            title={row.original.runId}
            to="/runs/$runId"
          >
            {row.original.runId}
          </Link>
        ) : (
          "—"
        ),
      enableSorting: false,
      header: "Run",
    },
    metricColumn("articlesDiscovered", "Discovered"),
    metricColumn("articlesPersisted", "Persisted"),
    metricColumn("articlesDelivered", "Delivered"),
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
    IngestionAgentActivity,
    "articlesDelivered" | "articlesDiscovered" | "articlesPersisted"
  >,
  header: string,
): ColumnDef<IngestionAgentActivity> {
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

function eventVariant(type: IngestionAgentActivity["type"]) {
  if (type === "run.failed" || type === "agent.reset") {
    return "destructive" as const;
  }

  if (type === "run.completed") {
    return "default" as const;
  }

  return "secondary" as const;
}
