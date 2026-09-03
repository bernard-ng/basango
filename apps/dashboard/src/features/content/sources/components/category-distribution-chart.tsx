"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import { ChartTooltip } from "@basango/ui/components/chart";
import { useQuery } from "@tanstack/react-query";
import type { DefaultTooltipContentProps, TooltipProps } from "recharts";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "#dashboard/app/components/recharts";
import { useTRPC } from "#dashboard/app/trpc/client";
import { getColorFromName } from "#dashboard/features/content/shared/utils/category-colors";

import { buildCategoryDistributionChartModel } from "../category-distribution-model";

const EMPTY_CHART_HEIGHT = 180;
const MINIMUM_CHART_HEIGHT = 260;
const BAR_ROW_HEIGHT = 48;

type CategoryDistributionChartProps = {
  sourceId: string;
};

export function CategoryDistributionChart({ sourceId }: CategoryDistributionChartProps) {
  const trpc = useTRPC();
  const { data } = useQuery(
    trpc.sources.getCategoryDistribution.queryOptions({
      id: sourceId,
    }),
  );
  const model = buildCategoryDistributionChartModel(data?.items ?? []);
  const chartHeight = Math.max(MINIMUM_CHART_HEIGHT, model.data.length * BAR_ROW_HEIGHT);

  return (
    <Card className="pt-0">
      <CardHeader className="border-b py-5">
        <CardTitle>Category distribution</CardTitle>
        <CardDescription>
          Every bar is a clustered category; each colored segment is an original category from the
          source.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {model.data.length > 0 ? (
          <>
            <div style={{ height: chartHeight }}>
              <ResponsiveContainer height="100%" width="100%">
                <BarChart
                  accessibilityLayer
                  data={model.data}
                  layout="vertical"
                  margin={{ bottom: 8, left: 8, right: 24, top: 8 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <YAxis
                    axisLine={false}
                    dataKey="category"
                    fontSize={12}
                    tickLine={false}
                    type="category"
                    width={140}
                  />
                  <XAxis
                    allowDecimals={false}
                    axisLine={false}
                    fontSize={12}
                    tickLine={false}
                    type="number"
                  />
                  <ChartTooltip content={<CategoryDistributionTooltip />} cursor={false} />
                  {model.series.map((series) => (
                    <Bar
                      dataKey={series.dataKey}
                      fill={getColorFromName(series.category)}
                      key={series.dataKey}
                      name={series.category}
                      stackId="originalCategory"
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-5 border-t pt-4">
              <p className="mb-3 text-xs font-medium text-muted-foreground">
                Original categories ({model.series.length})
              </p>
              <div className="grid max-h-32 grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-x-4 gap-y-2 overflow-y-auto pr-2 text-xs">
                {model.series.map((series) => (
                  <div className="flex min-w-0 items-center gap-2" key={series.dataKey}>
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: getColorFromName(series.category) }}
                    />
                    <span className="truncate" title={series.category}>
                      {series.category}
                    </span>
                    <span className="ml-auto tabular-nums text-muted-foreground">
                      {series.count.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div
            className="flex items-center justify-center text-sm text-muted-foreground"
            style={{ height: EMPTY_CHART_HEIGHT }}
          >
            No clustered category data is available for this source.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CategoryDistributionTooltip(
  props: TooltipProps<number, string> &
    Omit<DefaultTooltipContentProps<number, string>, "accessibilityLayer">,
) {
  const visibleItems = props.payload?.filter(
    (item) => typeof item.value === "number" && item.value > 0,
  );

  if (!props.active || !visibleItems?.length) {
    return null;
  }

  return (
    <div className="grid min-w-48 gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <p className="font-medium">{String(props.label)}</p>
      <div className="grid gap-1.5">
        {visibleItems.map((item) => (
          <div className="flex items-center gap-2" key={String(item.dataKey)}>
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="ml-auto font-mono font-medium tabular-nums">
              {Number(item.value).toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
