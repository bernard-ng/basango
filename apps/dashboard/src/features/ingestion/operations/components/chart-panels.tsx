import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@basango/ui/components/chart";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  RechartsSuspense,
  XAxis,
  YAxis,
} from "#dashboard/app/components/recharts";

import type { LatencyPoint, PipelinePoint, ThroughputPoint } from "../types";
import { DashboardPanel, EmptyState } from "./dashboard-primitives";

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

export function ThroughputPanel({ data }: { data: ThroughputPoint[] }) {
  return (
    <DashboardPanel
      description="Articles processed per 3-minute interval over the last 30 minutes"
      title="Throughput"
      trailing={<ThroughputLegend />}
    >
      <ChartContainer className="h-[280px] w-full" config={throughputConfig}>
        <RechartsSuspense>
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
        </RechartsSuspense>
      </ChartContainer>
    </DashboardPanel>
  );
}

export function PipelineStagesPanel({ data }: { data: PipelinePoint[] }) {
  return (
    <DashboardPanel description="Totals across the latest runs" title="Pipeline stages">
      <ChartContainer className="h-[280px] w-full" config={pipelineConfig}>
        <RechartsSuspense>
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
        </RechartsSuspense>
      </ChartContainer>
    </DashboardPanel>
  );
}

export function RunDurationPanel({ data }: { data: LatencyPoint[] }) {
  return (
    <DashboardPanel description="Completion time in minutes for recent runs" title="Run duration">
      {data.length === 0 ? (
        <EmptyState message="Duration telemetry will appear after a run completes." />
      ) : (
        <ChartContainer className="h-[280px] w-full" config={latencyConfig}>
          <RechartsSuspense>
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
          </RechartsSuspense>
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
