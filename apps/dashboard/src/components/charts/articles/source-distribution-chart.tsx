// @ts-nocheck
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
import { useQuery } from "@tanstack/react-query";
import { Cell, Pie, PieChart } from "recharts";

import { useTRPC } from "#dashboard/trpc/client";
import { getColorFromName } from "#dashboard/utils/categories";
import { formatNumber } from "#dashboard/utils/utils";

const chartConfig = {} satisfies ChartConfig;

export function SourceDistributionChart() {
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.articles.getSourceDistribution.queryOptions({
      limit: 10,
    }),
  );

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-start gap-2 space-y-0 border-b py-5 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-1">
          <CardTitle>Source distribution</CardTitle>
          <CardDescription>Share of articles by source</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer className="mx-auto aspect-square max-h-80 w-full" config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
            <Pie
              data={data?.items}
              dataKey="count"
              innerRadius={70}
              nameKey="name"
              outerRadius={110}
              paddingAngle={2}
              strokeWidth={0}
            >
              {data?.items.map((item) => (
                <Cell fill={getColorFromName(item.name)} key={item.id} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>

        <ul className="mt-4 space-y-2">
          {data?.items.map((item) => (
            <li className="flex items-center justify-between text-sm" key={item.id}>
              <span className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: getColorFromName(item.name) }}
                />
                <span className="font-medium leading-none">{item.name}</span>
              </span>
              <span className="text-muted-foreground">
                {formatNumber(item.count)} ({item.percentage}%)
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
