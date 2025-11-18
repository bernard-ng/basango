"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Card } from "@basango/ui/components/card";
import { Skeleton } from "@basango/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";

import { Status } from "#dashboard/components/charts/status";
import { Show } from "#dashboard/components/shell/show";
import { useTRPC } from "#dashboard/trpc/client";
import { formatNumber } from "#dashboard/utils/utils";

type DashboardOverview = RouterOutputs["reports"]["getDashboardOverview"];
type OverviewMetric = keyof DashboardOverview;

const LABELS: Record<OverviewMetric, string> = {
  articles: "Articles",
  sources: "Sources",
  users: "Users",
};

interface MetricProps {
  delta: DashboardOverview[OverviewMetric]["delta"] | undefined;
  label: string;
  loading: boolean;
  value: number | undefined;
}

function OverviewMetricSkeleton() {
  return (
    <>
      <Skeleton className="h-10 w-40" />
      <div className="flex items-center gap-2 text-sm font-medium">
        <Skeleton className="h-4 w-52" />
      </div>
    </>
  );
}

function OverviewMetricCard({ delta, label, loading, value }: MetricProps) {
  return (
    <Card className="flex flex-col gap-2 border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <Show fallback={<OverviewMetricSkeleton />} when={!loading}>
        <p className="text-4xl font-semibold">{formatNumber(value)}</p>
        <div className="flex items-center gap-2 text-sm font-medium">
          <Status percentage value={delta} />
          <span className="text-muted-foreground">vs previous 30 days</span>
        </div>
      </Show>
    </Card>
  );
}

export function DashboardOverviewCard() {
  const trpc = useTRPC();
  const { data, isPending } = useQuery(trpc.reports.getDashboardOverview.queryOptions());

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {(Object.keys(LABELS) as OverviewMetric[]).map((key) => (
        <OverviewMetricCard
          delta={data?.[key]?.delta}
          key={key}
          label={LABELS[key]}
          loading={isPending && !data}
          value={data?.[key]?.total}
        />
      ))}
    </div>
  );
}
