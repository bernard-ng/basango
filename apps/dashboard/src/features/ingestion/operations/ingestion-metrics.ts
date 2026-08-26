import { format, formatDistanceToNowStrict } from "date-fns";

import type { IngestionDashboardData, IngestionMetrics, ThroughputPoint } from "./types";

const EMPTY_METRICS: IngestionMetrics = {
  delivered: 0,
  discovered: 0,
  failed: 0,
  persisted: 0,
};
export const relativeTime = (date: Date) =>
  formatDistanceToNowStrict(new Date(date), { addSuffix: true });

export const stateVariant = (state: string) => {
  if (state === "failed" || state === "offline") return "destructive" as const;
  if (state === "completed" || state === "idle") return "secondary" as const;
  return "default" as const;
};

export const formatDuration = (durationMs: number | null) => {
  if (durationMs === null) return "—";
  if (durationMs < 1_000) return `${durationMs} ms`;
  if (durationMs < 60_000) return `${(durationMs / 1_000).toFixed(1)} s`;
  if (durationMs < 3_600_000) return `${(durationMs / 60_000).toFixed(1)} min`;

  const hours = Math.floor(durationMs / 3_600_000);
  const minutes = Math.round((durationMs % 3_600_000) / 60_000);

  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
};

const buildThroughputSeries = (
  throughput: IngestionDashboardData["throughput"],
): ThroughputPoint[] =>
  throughput.map((point) => ({
    delivered: point.articlesDelivered,
    discovered: point.articlesDiscovered,
    label: format(new Date(point.occurredAt), "HH:mm"),
    persisted: point.articlesPersisted,
  }));

export const createDashboardModel = ({ agents, summary, throughput }: IngestionDashboardData) => {
  const onlineAgents = agents.filter((agent) => agent.online);
  const totals = { ...EMPTY_METRICS, ...summary.totals };

  return {
    activeRunsCount: summary.activeRunsCount,
    completedRunsCount: summary.completedRunsCount,
    failedRunsCount: summary.failedRunsCount,
    latencySeries: summary.runDurations
      .slice()
      .reverse()
      .map((run) => ({
        duration: Math.round((run.durationMs / 60_000) * 100) / 100,
        label: format(new Date(run.lastSignalAt), "HH:mm"),
        source: run.sourceId,
      })),
    onlineAgentsCount: onlineAgents.length,
    pipelineData: [
      { color: "var(--chart-1)", stage: "Discovered", value: totals.discovered },
      { color: "var(--chart-2)", stage: "Persisted", value: totals.persisted },
      { color: "var(--chart-3)", stage: "Delivered", value: totals.delivered },
      { color: "var(--destructive)", stage: "Failed", value: totals.failed },
    ],
    successRate: summary.successRate,
    throughputSeries: buildThroughputSeries(throughput),
    totals,
  };
};
