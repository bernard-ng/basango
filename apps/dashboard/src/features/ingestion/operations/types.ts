import type { RouterOutputs } from "@basango/api/trpc/routers/_app";

export type IngestionOverview = RouterOutputs["operations"]["getIngestionOverview"];
export type IngestionAgent = IngestionOverview["agents"][number];
export type IngestionThroughput = IngestionOverview["throughput"][number];
export type IngestionRunsPage = RouterOutputs["operations"]["listIngestionRuns"];
export type IngestionRun = IngestionRunsPage["items"][number];

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
