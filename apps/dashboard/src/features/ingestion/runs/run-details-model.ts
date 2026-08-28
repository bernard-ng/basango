import { format } from "date-fns";

import type { PipelinePoint, ThroughputPoint } from "../operations/types";
import type { IngestionRunDetails } from "./types";

type RunDetailsModel = {
  pipelineData: PipelinePoint[];
  throughputSeries: ThroughputPoint[];
};

export function createRunDetailsModel(details: IngestionRunDetails): RunDetailsModel {
  const { run } = details;

  return {
    pipelineData: [
      { color: "var(--chart-1)", stage: "Discovered", value: run.articlesDiscovered },
      { color: "var(--chart-4)", stage: "Processed", value: run.articlesProcessed ?? 0 },
      { color: "var(--chart-2)", stage: "Persisted", value: run.articlesPersisted },
      { color: "var(--muted-foreground)", stage: "Skipped", value: run.articlesSkipped ?? 0 },
      { color: "var(--chart-3)", stage: "Delivered", value: run.articlesDelivered },
      { color: "var(--destructive)", stage: "Failed", value: run.articlesFailed },
    ],
    throughputSeries: details.throughput.map((point) => ({
      delivered: point.articlesDelivered,
      discovered: point.articlesDiscovered,
      label: format(new Date(point.occurredAt), "HH:mm:ss"),
      persisted: point.articlesPersisted,
    })),
  };
}
