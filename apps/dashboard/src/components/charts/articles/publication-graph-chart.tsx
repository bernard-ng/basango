"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import { ChartConfig, ChartContainer } from "@basango/ui/components/chart";
import { useQuery } from "@tanstack/react-query";

import { AreaChart } from "#dashboard/components/charts/area-chart";
import {
  ChartPeriodPicker,
  useChartPeriodFilter,
} from "#dashboard/components/charts/chart-filters";
import { Status } from "#dashboard/components/charts/status";
import { useTRPC } from "#dashboard/trpc/client";
import { formatNumber } from "#dashboard/utils/utils";

const chartConfig = {
  count: {
    color: "var(--chart-1)",
    label: "Articles",
  },
} satisfies ChartConfig;

export function PublicationGraphChart() {
  const trpc = useTRPC();
  const period = useChartPeriodFilter();

  const { data } = useQuery(
    trpc.articles.getPublications.queryOptions({
      range: period.range,
    }),
  );

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-start gap-2 space-y-0 border-b py-5 sm:flex-row sm:items-center">
        <div className="grid flex-1 gap-1">
          <CardTitle>{formatNumber(data?.meta?.current)} articles</CardTitle>
          <CardDescription>
            <div className="flex items-center justify-start gap-1 text-xs">
              <Status value={data?.meta?.delta} />
              <span className="text-muted-foreground">vs previous</span>
            </div>
          </CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <ChartPeriodPicker defaultDays={period.defaultDays} />
        </div>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer className="aspect-auto h-[250px] w-full" config={chartConfig}>
          <AreaChart data={data?.items ?? []} />
        </ChartContainer>
      </CardContent>

      <CardFooter>
        <CardDescription>
          Showing total crawled articles for the selected period,
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
            <span className="font-semibold text-foreground">
              {formatNumber(data?.meta?.current)} vs {formatNumber(data?.meta?.previous)} articles
            </span>
            <Status icons={false} percentage={true} value={data?.meta?.delta} />
            <span className="text-muted-foreground">period</span>
            {data?.meta?.previous === 0 && data?.meta?.current === 0 && (
              <span className="text-muted-foreground">(no articles yet)</span>
            )}
          </div>
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
