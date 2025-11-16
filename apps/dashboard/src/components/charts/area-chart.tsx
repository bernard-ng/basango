"use client";

import { ChartTooltip, ChartTooltipContent } from "@basango/ui/components/chart";
import { Area, AreaChart as BaseAreachart, CartesianGrid, XAxis, YAxis } from "recharts";

import { formatDate, formatNumber } from "#dashboard/utils/utils";

type AreaChartProps = {
  data: unknown;
};

export function AreaChart({ data }: AreaChartProps) {
  return (
    <BaseAreachart accessibilityLayer data={data}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis
        axisLine={false}
        dataKey="date"
        minTickGap={32}
        tickFormatter={(value) => formatDate(String(value))}
        tickLine={false}
        tickMargin={8}
      />
      <YAxis
        allowDecimals={false}
        axisLine={false}
        tickFormatter={(value) => formatNumber(Number(value))}
        tickLine={false}
        width={48}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            labelFormatter={(value) => formatDate(String(value), "PP")}
            nameKey="count"
          />
        }
        cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
      />
      <Area
        dataKey="count"
        fill="var(--color-count)"
        fillOpacity={0.15}
        stroke="var(--color-count)"
        strokeWidth={2}
        type="monotone"
      />
    </BaseAreachart>
  );
}
