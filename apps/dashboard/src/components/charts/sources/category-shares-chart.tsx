// @ts-nocheck
"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { ChartLimitToggle, useChartLimitFilter } from "#dashboard/components/charts/chart-filters";
import { useTRPC } from "#dashboard/trpc/client";
import { getColorFromName } from "#dashboard/utils/categories";

type Props = {
  sourceId: string;
};

export function CategorySharesChart({ sourceId }: Props) {
  const trpc = useTRPC();
  const { limit } = useChartLimitFilter();

  const { data } = useQuery(
    trpc.sources.getCategoryShares.queryOptions({
      id: sourceId,
      limit,
    }),
  );

  const chartData = [
    {
      name: "Total",
      ...Object.fromEntries(data?.items.map((item) => [item.category, item.count])),
    },
  ];

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Category Shares</CardTitle>
          <CardDescription>showing top {limit} categories for this source</CardDescription>
        </div>
        <ChartLimitToggle paramKey={`categoryLimit-${sourceId}`} />
      </CardHeader>
      <CardContent>
        <div className="-ml-1 h-20">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ bottom: 0, left: 0, right: 0, top: 0 }}
            >
              <YAxis
                axisLine={false}
                dataKey="name"
                fontSize={12}
                hide
                scale="band"
                type="category"
              />
              <XAxis axisLine={false} fontSize={12} hide tickLine={false} type="number" />
              <Legend align="left" iconSize={8} iconType="circle" />
              {data?.items.map((entry, index) => (
                <Bar
                  barSize={16}
                  className="transition-all delay-75"
                  dataKey={entry.category}
                  fill={getColorFromName(entry.category)}
                  key={`bar-${index}`}
                  radius={
                    index === 0 ? [4, 0, 0, 4] : index === data?.items.length - 1 ? [0, 4, 4, 0] : 0
                  }
                  stackId="category"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
