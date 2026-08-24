import { format, formatDistanceToNowStrict } from "date-fns";

import type {
  IngestionActivity,
  IngestionMetrics,
  IngestionOverview,
  ThroughputPoint,
} from "./types";

const EMPTY_METRICS: IngestionMetrics = {
  delivered: 0,
  discovered: 0,
  failed: 0,
  persisted: 0,
};
const THROUGHPUT_BUCKETS = 10;
const THROUGHPUT_WINDOW_MS = 30 * 60 * 1000;

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

const getActivityMetrics = (activity: IngestionActivity): IngestionMetrics | null => {
  if (!activity.data || typeof activity.data !== "object") return null;
  const metrics = activity.data.metrics;
  if (!metrics || typeof metrics !== "object") return null;

  const record = metrics as Record<string, unknown>;
  const readNumber = (key: string) => (typeof record[key] === "number" ? record[key] : 0);

  return {
    delivered: readNumber("articlesDelivered"),
    discovered: readNumber("articlesDiscovered"),
    failed: readNumber("articlesFailed"),
    persisted: readNumber("articlesPersisted"),
  };
};

const buildThroughputSeries = (
  activities: IngestionActivity[],
  generatedAt: Date,
): ThroughputPoint[] => {
  const end = new Date(generatedAt).getTime();
  const start = end - THROUGHPUT_WINDOW_MS;
  const bucketSize = THROUGHPUT_WINDOW_MS / THROUGHPUT_BUCKETS;
  const points = Array.from({ length: THROUGHPUT_BUCKETS }, (_, index) => ({
    delivered: 0,
    discovered: 0,
    label: format(new Date(start + index * bucketSize), "HH:mm"),
    persisted: 0,
  }));
  const previousByRun = new Map<string, IngestionMetrics>();

  for (const activity of [...activities].reverse()) {
    const occurredAt = new Date(activity.occurredAt).getTime();
    if (occurredAt < start || occurredAt > end) continue;

    const metrics = getActivityMetrics(activity);
    if (!metrics) continue;

    const runKey = activity.runId ?? activity.id;
    const previous = previousByRun.get(runKey) ?? EMPTY_METRICS;
    const bucketIndex = Math.min(
      THROUGHPUT_BUCKETS - 1,
      Math.max(0, Math.floor((occurredAt - start) / bucketSize)),
    );
    const point = points[bucketIndex];
    if (!point) continue;

    point.delivered += Math.max(0, metrics.delivered - previous.delivered);
    point.discovered += Math.max(0, metrics.discovered - previous.discovered);
    point.persisted += Math.max(0, metrics.persisted - previous.persisted);
    previousByRun.set(runKey, metrics);
  }

  return points;
};

export const createDashboardModel = ({
  activities,
  agents,
  generatedAt,
  runs,
}: IngestionOverview) => {
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
    throughputSeries: buildThroughputSeries(activities, generatedAt),
    totals,
  };
};
