"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@basango/ui/components/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@basango/ui/components/select";
import { useQuery } from "@tanstack/react-query";
import * as React from "react";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import { useTRPC } from "#dashboard/trpc/client";
import { formatDate } from "#dashboard/utils/utils";

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
  sourceId: string;
};

export function SourcePublicationgGraphChart({ sourceId }: Props) {
  const trpc = useTRPC();
  const [timeRange, setTimeRange] = React.useState("30");

  const { data } = useQuery(
    trpc.sources.getPublicationGraph.queryOptions({
      days: Number(timeRange),
      id: sourceId,
    }),
  );

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Publication Graph</CardTitle>
          <CardDescription>
            Showing total crawled articles for the last {timeRange} days
          </CardDescription>
        </div>
        <Select onValueChange={setTimeRange} value={timeRange}>
          <SelectTrigger
            aria-label="Select a value"
            className="hidden w-40 rounded-lg sm:ml-auto sm:flex"
          >
            <SelectValue placeholder="Last 3 months" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem className="rounded-lg" value="7">
              Last 7 days
            </SelectItem>
            <SelectItem className="rounded-lg" value="30">
              Last 30 days
            </SelectItem>
            <SelectItem className="rounded-lg" value="90">
              Last 3 months
            </SelectItem>
            <SelectItem className="rounded-lg" value="180">
              Last 6 months
            </SelectItem>
            <SelectItem className="rounded-lg" value="365">
              Last 12 months
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer className="aspect-auto h-[250px] w-full" config={chartConfig}>
          <BarChart accessibilityLayer data={data?.items}>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={32}
              tickFormatter={(value) => formatDate(new Date(value).toISOString())}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="dashed" />} cursor={false} />
            <Bar dataKey="count" fill="var(--color-count)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
