"use client";

import { Badge } from "@basango/ui/components/badge";
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
import { Separator } from "@basango/ui/components/separator";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

interface CredibilityMetric {
  bias: string;
  reliability: string;
  transparency: string;
}

interface PublicationItem {
  date: string;
  count: number;
}

interface SourceCardProps {
  id: string;
  name: string;
  displayName: string | null;
  url: string;
  description: string;
  publicationGraph: {
    items: PublicationItem[];
    total: number;
  };
  credibility: CredibilityMetric;
}

const credibilityColors = {
  high: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  low: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
};

function getCredibilityColor(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes("high") || lower.includes("strong") || lower.includes("good")) {
    return credibilityColors.high;
  }
  if (lower.includes("medium") || lower.includes("moderate")) {
    return credibilityColors.medium;
  }
  return credibilityColors.low;
}

const chartConfig = {
  count: {
    color: "var(--chart-2)",
    label: "Articles",
  },
  views: {
    label: "Articles",
  },
} satisfies ChartConfig;

export function SourceCard({
  id,
  name,
  displayName,
  url,
  description,
  publicationGraph,
  credibility,
}: SourceCardProps) {
  const chartData = publicationGraph.items;

  return (
    <Card className="w-full max-w-6xl border-border">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>
                <a
                  aria-label="Visit source website"
                  href={url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {displayName || name}
                </a>
              </CardTitle>
            </div>
            <CardDescription className="text-base">{description}</CardDescription>
            <p className="text-xs text-muted-foreground">ID: {id}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <ChartContainer className="aspect-auto h-[250px] w-full" config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                });
              }}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                  }}
                  nameKey="views"
                />
              }
            />
            <Bar dataKey="count" fill={`var(--color-2)`} />
          </BarChart>
        </ChartContainer>

        <Separator />
        <div className="space-y-2">
          <h3 className="font-semibold">Credibility Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Bias</p>
              <Badge className={`${getCredibilityColor(credibility.bias)} border-0`}>
                {credibility.bias}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Reliability</p>
              <Badge className={`${getCredibilityColor(credibility.reliability)} border-0`}>
                {credibility.reliability}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Transparency</p>
              <Badge className={`${getCredibilityColor(credibility.transparency)} border-0`}>
                {credibility.transparency}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />
        <div className="space-y-2">
          <h3 className="font-semibold">Summary</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Publications</p>
              <p className="text-2xl font-bold">{publicationGraph.total}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Timeline Entries</p>
              <p className="text-2xl font-bold">{publicationGraph.items.length}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
