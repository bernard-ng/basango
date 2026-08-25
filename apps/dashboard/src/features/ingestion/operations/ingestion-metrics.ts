import { format, formatDistanceToNowStrict } from "date-fns";

import type {
  IngestionMetrics,
  IngestionOverview,
  IngestionThroughput,
  ThroughputPoint,
} from "./types";

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
  return `${(durationMs / 60_000).toFixed(1)} min`;
};

const buildThroughputSeries = (throughput: IngestionThroughput[]): ThroughputPoint[] =>
  throughput.map((point) => ({
    delivered: point.articlesDelivered,
    discovered: point.articlesDiscovered,
    label: format(new Date(point.occurredAt), "HH:mm"),
    persisted: point.articlesPersisted,
  }));

export const createDashboardModel = ({ agents, runs, throughput }: IngestionOverview) => {
  const activeRuns = runs.filter((run) => run.state === "preparing" || run.state === "running");
  const onlineAgents = agents.filter((agent) => agent.online);
  const failedRuns = runs.filter((run) => run.state === "failed");
  const completedRuns = runs.filter((run) => run.state === "completed");
  const totals = runs.reduce(
    (current, run) => ({
      delivered: current.delivered + run.articlesDelivered,
      discovered: current.discovered + run.articlesDiscovered,
      failed: current.failed + run.articlesFailed,
      persisted: current.persisted + run.articlesPersisted,
    }),
    { ...EMPTY_METRICS },
  );
  const terminalRuns = completedRuns.length + failedRuns.length;

  return {
    activeRunsCount: activeRuns.length,
    completedRunsCount: completedRuns.length,
    failedRunsCount: failedRuns.length,
    latencySeries: runs
      .filter((run) => run.durationMs !== null)
      .slice(0, 12)
      .reverse()
      .map((run) => ({
        duration: Math.round(((run.durationMs ?? 0) / 1_000) * 10) / 10,
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
    successRate: terminalRuns === 0 ? 100 : Math.round((completedRuns.length / terminalRuns) * 100),
    throughputSeries: buildThroughputSeries(throughput),
    totals,
  };
};
