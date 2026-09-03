import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@basango/ui/components/chart";
import { TimerIcon } from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "#dashboard/app/components/recharts";
import { IngestionEmptyState } from "#dashboard/features/ingestion/shared/components/ingestion-empty-state";

import type { LatencyPoint, PipelinePoint, ThroughputPoint } from "../types";
import { DashboardPanel } from "./dashboard-primitives";

const throughputConfig = {
  delivered: { color: "var(--chart-3)", label: "Delivered" },
  discovered: { color: "var(--chart-1)", label: "Discovered" },
  persisted: { color: "var(--chart-2)", label: "Persisted" },
} satisfies ChartConfig;

const pipelineConfig = {
  value: { color: "var(--chart-1)", label: "Articles" },
} satisfies ChartConfig;

const latencyConfig = {
  duration: { color: "var(--chart-4)", label: "Duration (min)" },
} satisfies ChartConfig;

type ThroughputPanelProps = {
  data: ThroughputPoint[];
  description?: string;
};

type PipelineStagesPanelProps = {
  data: PipelinePoint[];
  description?: string;
};

type RunDurationPanelProps = {
  data: LatencyPoint[];
};

export function ThroughputPanel({
  data,
  description = "Articles processed per 3-minute interval over the last 30 minutes",
}: ThroughputPanelProps) {
  return (
    <DashboardPanel description={description} title="Throughput" trailing={<ThroughputLegend />}>
      <ChartContainer className="h-[280px] w-full" config={throughputConfig}>
        <AreaChart accessibilityLayer data={data} margin={{ left: -16, right: 8 }}>
          <defs>
            <linearGradient id="discovered-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--color-discovered)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-discovered)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
          <YAxis allowDecimals={false} axisLine={false} tickLine={false} width={44} />
          <ChartTooltip
            content={<ChartTooltipContent indicator="line" />}
            cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
          />
          <Area
            dataKey="discovered"
            fill="url(#discovered-fill)"
            stroke="var(--color-discovered)"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="persisted"
            dot={false}
            stroke="var(--color-persisted)"
            strokeWidth={2}
            type="monotone"
          />
          <Line
            dataKey="delivered"
            dot={false}
            stroke="var(--color-delivered)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ChartContainer>
    </DashboardPanel>
  );
}

export function PipelineStagesPanel({
  data,
  description = "Totals across the latest runs",
}: PipelineStagesPanelProps) {
  return (
    <DashboardPanel description={description} title="Pipeline stages">
      <ChartContainer className="h-[280px] w-full" config={pipelineConfig}>
        <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 8 }}>
          <CartesianGrid horizontal={false} strokeDasharray="3 3" />
          <XAxis allowDecimals={false} axisLine={false} tickLine={false} type="number" />
          <YAxis axisLine={false} dataKey="stage" tickLine={false} type="category" width={74} />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry) => (
              <Cell fill={entry.color} key={entry.stage} />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </DashboardPanel>
  );
}

export function RunDurationPanel({ data }: RunDurationPanelProps) {
  return (
    <DashboardPanel description="Completion time in minutes for recent runs" title="Run duration">
      {data.length === 0 ? (
        <IngestionEmptyState
          className="h-[280px]"
          description="Duration telemetry will appear after a run completes."
          icon={TimerIcon}
          title="No run duration data"
        />
      ) : (
        <ChartContainer className="h-[280px] w-full" config={latencyConfig}>
          <LineChart accessibilityLayer data={data} margin={{ left: -12, right: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis axisLine={false} dataKey="label" tickLine={false} tickMargin={8} />
            <YAxis
              axisLine={false}
              tickFormatter={(value) => `${value} min`}
              tickLine={false}
              width={48}
            />
            <ChartTooltip
              content={<ChartTooltipContent indicator="line" />}
              cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
            />
            <Line
              activeDot={{ r: 4 }}
              dataKey="duration"
              dot={{ fill: "var(--color-duration)", r: 2 }}
              stroke="var(--color-duration)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      )}
    </DashboardPanel>
  );
}

function ThroughputLegend() {
  return (
    <div className="hidden items-center gap-3 text-[11px] text-muted-foreground sm:flex">
      <LegendItem color="bg-[var(--chart-1)]" label="Discovered" />
      <LegendItem color="bg-[var(--chart-2)]" label="Persisted" />
      <LegendItem color="bg-[var(--chart-3)]" label="Delivered" />
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
