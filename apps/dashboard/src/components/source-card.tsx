"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@basango/ui/components/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { RouterOutputs } from "#api/trpc/routers/_app";
import { formatDate, formatNumber } from "#dashboard/utils/utils";

const chartConfig = {
  count: {
    color: "var(--chart-2)",
    label: "Articles",
  },
  views: {
    label: "Articles",
  },
} satisfies ChartConfig;

type Props = {
  source: RouterOutputs["sources"]["list"][number];
};

export function SourceCard({ source }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{source.name}</CardTitle>
        <CardDescription>{source.id}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={source.publications?.items}>
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
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {formatNumber(source.articles)} articles crawled
        </div>
        <div className="text-muted-foreground leading-none">Showing last 30 days</div>
      </CardFooter>
    </Card>
  );
}
