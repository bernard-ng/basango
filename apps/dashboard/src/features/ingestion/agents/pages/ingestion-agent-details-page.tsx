"use client";

import { Badge } from "@basango/ui/components/badge";
import { buttonVariants } from "@basango/ui/components/button";
import { Card, CardContent } from "@basango/ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@basango/ui/components/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeftIcon } from "lucide-react";

import { Detail, DetailsSection } from "#dashboard/app/components/detail-list";
import { DetailsPageHeader } from "#dashboard/app/components/details-page-header";
import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";

import { IngestionRunsTable } from "../../runs/components/ingestion-runs-table";
import { stateVariant } from "../../shared/ingestion-formatters";
import { IngestionAgentActivityTable } from "../components/ingestion-agent-activity-table";

type IngestionAgentDetailsPageProps = {
  agentId: string;
};

export function IngestionAgentDetailsPage({ agentId }: IngestionAgentDetailsPageProps) {
  const trpc = useTRPC();
  const detailsQuery = useSuspenseQuery({
    ...trpc.operations.getIngestionAgentDetails.queryOptions({ agentId }),
    refetchInterval: 5_000,
  });
  const { agent, summary } = detailsQuery.data;

  return (
    <PageLayout>
      <div className="space-y-6">
        <DetailsPageHeader
          actions={
            <Link className={buttonVariants({ variant: "outline" })} to="/ingestion">
              <ArrowLeftIcon data-icon="inline-start" />
              Ingestion monitor
            </Link>
          }
          description={
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={stateVariant(agent.state)}>{agent.state}</Badge>
              <span className="text-sm text-muted-foreground">
                {agent.online ? "Online" : "Offline"}
              </span>
            </div>
          }
          eyebrow="Ingestion agent"
          title={agent.id}
        />

        <Card>
          <CardContent className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            <DetailsSection title="Registration">
              <Detail label="Registered">{formatAgentDate(agent.registeredAt)}</Detail>
              <Detail label="Last seen">{formatAgentDate(agent.lastSeenAt)}</Detail>
            </DetailsSection>
            <DetailsSection title="Runtime">
              <Detail label="Version">{agent.version ? `v${agent.version}` : "—"}</Detail>
              <Detail label="Active run">
                {agent.activeRunId ? (
                  <Link
                    className="font-mono text-xs text-foreground underline-offset-4 hover:underline"
                    params={{ runId: agent.activeRunId }}
                    to="/runs/$runId"
                  >
                    {agent.activeRunId}
                  </Link>
                ) : (
                  "—"
                )}
              </Detail>
            </DetailsSection>
            <DetailsSection title="History">
              <Detail label="Runs">{summary.totalRuns.toLocaleString()}</Detail>
              <Detail label="Completed">{summary.completedRuns.toLocaleString()}</Detail>
              <Detail label="Failed">{summary.failedRuns.toLocaleString()}</Detail>
              <Detail label="Delivered">{summary.articlesDelivered.toLocaleString()}</Detail>
            </DetailsSection>
          </CardContent>
        </Card>

        <Tabs className="space-y-4" defaultValue="runs">
          <TabsList>
            <TabsTrigger value="runs">Agent runs</TabsTrigger>
            <TabsTrigger value="activity">Agent activity</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="runs">
            <p className="text-sm text-muted-foreground">
              Every ingestion run assigned to this agent.
            </p>
            <IngestionRunsTable
              agentId={agent.id}
              realtime={false}
              refetchInterval={5_000}
              tableId={`agent.${agent.id}.ingestion-runs`}
            />
          </TabsContent>

          <TabsContent className="space-y-4" value="activity">
            <p className="text-sm text-muted-foreground">
              Heartbeats, resets, and run signals reported by this agent, newest first.
            </p>
            <IngestionAgentActivityTable agentId={agent.id} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}

function formatAgentDate(value: Date) {
  return format(new Date(value), "MMM d, yyyy HH:mm:ss");
}
