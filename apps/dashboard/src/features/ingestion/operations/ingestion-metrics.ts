import { format } from "date-fns";

import type { IngestionDashboardData, IngestionMetrics, ThroughputPoint } from "./types";

const EMPTY_METRICS: IngestionMetrics = {
  delivered: 0,
  discovered: 0,
  failed: 0,
  persisted: 0,
  processed: 0,
  skipped: 0,
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
      { color: "var(--chart-4)", stage: "Processed", value: totals.processed },
      { color: "var(--chart-2)", stage: "Persisted", value: totals.persisted },
      { color: "var(--muted-foreground)", stage: "Skipped", value: totals.skipped },
      { color: "var(--chart-3)", stage: "Delivered", value: totals.delivered },
      { color: "var(--destructive)", stage: "Failed", value: totals.failed },
    ],
    successRate: summary.successRate,
    throughputSeries: buildThroughputSeries(throughput),
    totals,
  };
};
