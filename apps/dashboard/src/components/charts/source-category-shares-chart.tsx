"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import { ToggleGroup, ToggleGroupItem } from "@basango/ui/components/toggle-group";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bar, BarChart, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { useTRPC } from "#dashboard/trpc/client";
import { getColorFromName } from "#dashboard/utils/categories";

type Props = {
  sourceId: string;
};

export function SourceCategorySharesChart({ sourceId }: Props) {
  const trpc = useTRPC();
  const [limit, setLimit] = useState(10);

  const { data } = useQuery(
    trpc.sources.getCategoryShares.queryOptions({
      id: sourceId,
      limit: limit,
    }),
  );
  const items = data?.items ?? [];

  const chartData = [
    {
      name: "Total",
      ...Object.fromEntries(items.map((item) => [item.category, item.count])),
    },
  ];

  const barData = items.map((item) => ({
    fill: getColorFromName(item.category),
    name: item.category,
  }));

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Category Shares</CardTitle>
          <CardDescription>showing top {limit} categories for this source</CardDescription>
        </div>
        <ToggleGroup
          className="*:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          onValueChange={(v) => setLimit(Number(v))}
          type="single"
          value={String(limit)}
          variant="outline"
        >
          <ToggleGroupItem value="10">Top 10</ToggleGroupItem>
          <ToggleGroupItem value="20">Top 20</ToggleGroupItem>
          <ToggleGroupItem value="50">Top 50</ToggleGroupItem>
        </ToggleGroup>
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
              {barData.map((entry, index) => (
                <Bar
                  barSize={16}
                  className="transition-all delay-75"
                  dataKey={entry.name}
                  fill={entry.fill}
                  key={`bar-${index}`}
                  radius={
                    index === 0 ? [4, 0, 0, 4] : index === barData.length - 1 ? [0, 4, 4, 0] : 0
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
