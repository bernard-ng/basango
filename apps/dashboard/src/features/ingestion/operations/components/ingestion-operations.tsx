"use client";

import { Activity, ArrowDownToLine, CircleCheck, Radio } from "lucide-react";

import { IngestionRunsTable } from "#dashboard/features/ingestion/runs/components/ingestion-runs-table";

import { createDashboardModel } from "../ingestion-metrics";
import type { IngestionDashboardData } from "../types";
import { PipelineStagesPanel, RunDurationPanel, ThroughputPanel } from "./chart-panels";
import { IngestionOperationsSkeleton, MetricCard } from "./dashboard-primitives";
import { AgentHealthPanel } from "./status-panels";

export function IngestionOperations({
  data,
  isPending,
}: {
  data: IngestionDashboardData | undefined;
  isPending: boolean;
}) {
  if (isPending || !data) {
    return <IngestionOperationsSkeleton />;
  }

  const { agents } = data;
  const model = createDashboardModel(data);

  return (
    <div className="flex flex-col gap-4 pb-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${agents.length} registered agent${agents.length === 1 ? "" : "s"}`}
          icon={Radio}
          label="Agents online"
          tone={model.onlineAgentsCount === agents.length ? "healthy" : "warning"}
          value={model.onlineAgentsCount}
        />
        <MetricCard
          detail={`${model.completedRunsCount} recently completed`}
          icon={Activity}
          label="Active runs"
          tone="neutral"
          value={model.activeRunsCount}
        />
        <MetricCard
          detail="Across the latest 24 runs"
          icon={ArrowDownToLine}
          label="Articles delivered"
          tone="healthy"
          value={model.totals.delivered}
        />
        <MetricCard
          detail={`${model.failedRunsCount} failed run${model.failedRunsCount === 1 ? "" : "s"}`}
          icon={CircleCheck}
          label="Run success rate"
          suffix="%"
          tone={model.failedRunsCount > 0 ? "danger" : "healthy"}
          value={model.successRate}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <ThroughputPanel data={model.throughputSeries} />
        <PipelineStagesPanel data={model.pipelineData} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <RunDurationPanel data={model.latencySeries} />
        <AgentHealthPanel agents={agents} />
      </div>

      <IngestionRunsTable />
    </div>
  );
}
