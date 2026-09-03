import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@basango/ui/components/chart";
import { Skeleton } from "@basango/ui/components/skeleton";
import {
  ChartNoAxesColumnIncreasingIcon,
  CircleCheckIcon,
  CircleHelpIcon,
  ClockIcon,
} from "lucide-react";

import { MetricCard } from "#dashboard/app/components/metric-card";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  XAxis,
  YAxis,
} from "#dashboard/app/components/recharts";
import { formatNumber } from "#dashboard/app/utils/formatters";
import { getColorFromName } from "#dashboard/features/content/shared/utils/category-colors";

type ClusteringStatsData = RouterOutputs["categories"]["stats"];

type ClusteringStatsProps = {
  stats: ClusteringStatsData;
};

const chartConfig = {
  articleCount: {
    color: "var(--chart-1)",
    label: "Articles",
  },
} satisfies ChartConfig;

export function ClusteringStats({ stats }: ClusteringStatsProps) {
  const distribution = stats.categories.slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          detail={`${formatNumber(stats.clustered)} of ${formatNumber(stats.total)} articles`}
          icon={ChartNoAxesColumnIncreasingIcon}
          label="Clustering coverage"
          suffix="%"
          tone={stats.clusteringPercent >= 95 ? "healthy" : "warning"}
          value={stats.clusteringPercent}
        />
        <MetricCard
          detail={`${formatNumber(stats.total)} collected articles`}
          icon={CircleCheckIcon}
          label="Clustered articles"
          tone="healthy"
          value={stats.clustered}
        />
        <MetricCard
          detail="Waiting for the clustering worker"
          icon={ClockIcon}
          label="Pending clustering"
          tone={stats.pending > 0 ? "warning" : "healthy"}
          value={stats.pending}
        />
        <MetricCard
          detail={`${formatNumber(stats.unassigned)} currently unassigned`}
          icon={CircleHelpIcon}
          label="Fallback assignments"
          tone={stats.fallbackAssignments > 0 ? "warning" : "neutral"}
          value={stats.fallbackAssignments}
        />
      </div>

      <Card className="pt-0">
        <CardHeader className="border-b py-5">
          <CardTitle>Assignment distribution</CardTitle>
          <CardDescription>Articles assigned to the ten largest categories</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <ChartContainer className="h-[320px] w-full" config={chartConfig}>
            <BarChart accessibilityLayer data={distribution} layout="vertical">
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis allowDecimals={false} axisLine={false} tickLine={false} type="number" />
              <YAxis
                axisLine={false}
                dataKey="name"
                tickLine={false}
                tickMargin={8}
                type="category"
                width={150}
              />
              <ChartTooltip
                content={<ChartTooltipContent nameKey="name" />}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Bar dataKey="articleCount" radius={[0, 4, 4, 0]}>
                {distribution.map((category) => (
                  <Cell fill={getColorFromName(category.name)} key={category.id} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export function ClusteringStatsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-4" role="status">
      <span className="sr-only">Loading category summary and charts</span>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Card className="flex flex-col gap-2 border-border bg-card p-4" key={index}>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-10 w-24" />
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded-full" />
              <Skeleton className="h-5 w-40 max-w-[calc(100%-1.5rem)]" />
            </div>
          </Card>
        ))}
      </div>

      <Card className="pt-0">
        <CardHeader className="border-b py-5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-72 max-w-full" />
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <Skeleton className="h-[320px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
