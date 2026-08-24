"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import { ChartConfig, ChartContainer } from "@basango/ui/components/chart";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "#dashboard/app/trpc/client";
import { AreaChart } from "#dashboard/features/content/shared/components/area-chart";
import {
  ChartPeriodPicker,
  useChartPeriodFilter,
} from "#dashboard/features/content/shared/components/chart-filters";

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

export function PublicationGraphChart({ sourceId }: Props) {
  const trpc = useTRPC();
  const period = useChartPeriodFilter();

  const { data } = useQuery(
    trpc.sources.getPublications.queryOptions({
      id: sourceId,
      range: period.range,
    }),
  );

  return (
    <Card className="pt-0">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Publication Graph</CardTitle>
          <CardDescription>Showing total crawled articles for the selected period</CardDescription>
        </div>
        <ChartPeriodPicker defaultDays={period.defaultDays} />
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer className="aspect-auto h-[250px] w-full" config={chartConfig}>
          <AreaChart data={data?.items ?? []} />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
