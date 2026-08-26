import type { RouterOutputs } from "@basango/api/trpc/routers/_app";

export type IngestionAgents = RouterOutputs["operations"]["getIngestionAgents"];
export type IngestionSummary = RouterOutputs["operations"]["getIngestionSummary"];
export type IngestionThroughput = RouterOutputs["operations"]["getIngestionThroughput"];
export type IngestionRunsPage = RouterOutputs["operations"]["listIngestionRuns"];
export type IngestionAgent = IngestionAgents["agents"][number];
export type IngestionRun = IngestionRunsPage["items"][number];

export type IngestionDashboardData = {
  agents: IngestionAgents["agents"];
  summary: IngestionSummary;
  throughput: IngestionThroughput;
};

export type IngestionMetrics = {
  delivered: number;
  discovered: number;
  failed: number;
  persisted: number;
};

export type ThroughputPoint = Pick<IngestionMetrics, "delivered" | "discovered" | "persisted"> & {
  label: string;
};

export type PipelinePoint = {
  color: string;
  stage: string;
  value: number;
};

export type LatencyPoint = {
  duration: number;
  label: string;
  source: string;
};
