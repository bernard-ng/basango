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
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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

type SourceDetails = {
  id: string;
  name: string;
  displayName: string | null;
  url: string;
  description: string;
  publicationGraph: {
    items: { date: string; count: number }[];
    total: number;
  };
  credibility: {
    bias: string;
    reliability: string;
    transparency: string;
  };
  articles: number;
};

export function SourceCard({ source }: { source: SourceDetails }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{source.name}</CardTitle>
        <CardDescription>{source.id}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={source.publicationGraph.items}>
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
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 leading-none font-medium">
          {formatNumber(source.articles)} articles crawled
        </div>
        <div className="text-muted-foreground leading-none">
          Showing last {source.publicationGraph.total} days
        </div>
      </CardFooter>
    </Card>
  );
}
