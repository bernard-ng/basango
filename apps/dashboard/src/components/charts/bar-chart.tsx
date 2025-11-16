"use client";

import { ChartTooltip, ChartTooltipContent } from "@basango/ui/components/chart";
import { Bar, BarChart as BaseBarChart, CartesianGrid, XAxis } from "recharts";

import { formatDate } from "#dashboard/utils/utils";

type BarChartProps<T> = {
  data: T[];
};

export function BarChart<T>({ data }: BarChartProps<T>) {
  return (
    <BaseBarChart accessibilityLayer data={data}>
      <CartesianGrid vertical={false} />
      <XAxis
        axisLine={false}
        dataKey="date"
        minTickGap={32}
        tickFormatter={(value) => formatDate(value)}
        tickLine={false}
        tickMargin={8}
      />
      <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} cursor={false} />
      <Bar dataKey="count" fill="var(--color-count)" radius={4} />
    </BaseBarChart>
  );
}
