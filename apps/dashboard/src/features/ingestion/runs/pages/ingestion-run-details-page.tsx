"use client";

import { Badge } from "@basango/ui/components/badge";
import { buttonVariants } from "@basango/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@basango/ui/components/card";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";

import { Detail, DetailsSection } from "#dashboard/app/components/detail-list";
import { DetailsPageHeader } from "#dashboard/app/components/details-page-header";
import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";

import { PipelineStagesPanel, ThroughputPanel } from "../../operations/components/chart-panels";
import { formatDuration, stateVariant } from "../../shared/ingestion-formatters";
import { IngestionRunActivityTable } from "../components/ingestion-run-activity-table";
import { createRunDetailsModel } from "../run-details-model";

type IngestionRunDetailsPageProps = {
  runId: string;
};

export function IngestionRunDetailsPage({ runId }: IngestionRunDetailsPageProps) {
  const trpc = useTRPC();
  const detailsQuery = useSuspenseQuery({
    ...trpc.operations.getIngestionRunDetails.queryOptions({ runId }),
    refetchInterval: (query) => {
      const state = query.state.data?.run.state;

      return state === "preparing" || state === "running" ? 3_000 : false;
    },
  });
  const { run } = detailsQuery.data;
  const model = createRunDetailsModel(detailsQuery.data);
  const isLive = run.state === "preparing" || run.state === "running";

  return (
    <PageLayout>
      <div className="space-y-4">
        <DetailsPageHeader
          actions={
            <Link className={buttonVariants({ variant: "outline" })} to="/ingestion">
              <ArrowLeftIcon data-icon="inline-start" />
              All runs
            </Link>
          }
          description={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={stateVariant(run.state)}>{run.state}</Badge>
              <span className="text-sm text-muted-foreground">Agent {run.agentId}</span>
            </div>
          }
          eyebrow="Ingestion run"
          identifier={run.id}
          title={run.sourceId}
        />

        <Card>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <DetailsSection title="Timing">
              <Detail label="Started">{formatRunDate(run.startedAt ?? run.createdAt)}</Detail>
              <Detail label="Last activity">{formatRunDate(run.lastSignalAt)}</Detail>
            </DetailsSection>
            <DetailsSection title="Outcome">
              <Detail label="Duration">{formatDuration(run.durationMs)}</Detail>
              <Detail label="Delivered">{run.articlesDelivered.toLocaleString()}</Detail>
            </DetailsSection>
          </CardContent>
        </Card>

        {run.error ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardHeader>
              <CardTitle className="text-destructive">Run error</CardTitle>
              <CardDescription className="wrap-break-word text-destructive/90">
                {run.error}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
          <ThroughputPanel
            data={model.throughputSeries}
            description="Article increments across this run, from its first signal to its latest activity"
          />
          <PipelineStagesPanel
            data={model.pipelineData}
            description="Current article totals for this run only"
          />
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="font-semibold">Activity events</h2>
            <p className="text-sm text-muted-foreground">
              Every crawler signal recorded for this run, newest first.
            </p>
          </div>
          <IngestionRunActivityTable isLive={isLive} runId={run.id} />
        </section>
      </div>
    </PageLayout>
  );
}

function formatRunDate(value: Date) {
  return format(new Date(value), "MMM d, yyyy HH:mm:ss");
}
