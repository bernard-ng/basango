import { Badge } from "@basango/ui/components/badge";
import { Button, buttonVariants } from "@basango/ui/components/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@basango/ui/components/tabs";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ExternalLinkIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { DetailsPageHeader } from "#dashboard/app/components/details-page-header";
import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";
import { ArticlesFeed } from "#dashboard/features/content/articles/components/articles-feed";

import { CategorySharesChart } from "../components/category-shares-chart";
import { PublicationGraphChart } from "../components/publication-graph-chart";
import { SourceDetailsTab } from "../components/source-details-tab";
import { SourceIngestionRuns } from "../components/source-ingestion-runs";
import { SourceDeleteDialog } from "../dialogs/source-delete-dialog";
import { SourceEditDialog } from "../dialogs/source-edit-dialog";

type SourceDetailsPageProps = {
  sourceId: string;
};

export function SourceDetailsPage({ sourceId }: SourceDetailsPageProps) {
  const trpc = useTRPC();
  const { data: source } = useSuspenseQuery(trpc.sources.getById.queryOptions({ id: sourceId }));
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  return (
    <PageLayout>
      <div className="space-y-4">
        <DetailsPageHeader
          actions={
            <>
              <a
                className={buttonVariants({ variant: "outline" })}
                href={source.url}
                rel="noreferrer"
                target="_blank"
              >
                <ExternalLinkIcon data-icon="inline-start" />
                Visit website
              </a>
              <Button onClick={() => setIsEditOpen(true)} type="button">
                <PencilIcon />
                Edit source
              </Button>
              <Button
                onClick={() => setIsDeleteOpen(true)}
                type="button"
                variant="destructive"
              >
                <Trash2Icon />
                Delete source
              </Button>
            </>
          }
          description={
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{source.displayName ?? source.name}</Badge>
              {source.credibility?.reliability ? (
                <Badge variant="outline">{source.credibility.reliability}</Badge>
              ) : null}
            </div>
          }
          eyebrow="Source"
          identifier={source.id}
          title={source.displayName ?? source.name}
        />

        <Tabs className="space-y-4" defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="articles">Articles</TabsTrigger>
            <TabsTrigger value="ingestion">Ingestion</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
          <TabsContent className="space-y-4" value="overview">
            <CategorySharesChart sourceId={source.id} />
            <PublicationGraphChart sourceId={source.id} />
          </TabsContent>
          <TabsContent value="articles">
            <ArticlesFeed sourceId={source.id} />
          </TabsContent>
          <TabsContent value="ingestion">
            <SourceIngestionRuns sourceId={source.id} sourceName={source.name} />
          </TabsContent>
          <TabsContent value="details">
            <SourceDetailsTab source={source} />
          </TabsContent>
        </Tabs>
      </div>

      <SourceDeleteDialog onOpenChange={setIsDeleteOpen} open={isDeleteOpen} source={source} />
      <SourceEditDialog onOpenChange={setIsEditOpen} open={isEditOpen} source={source} />
    </PageLayout>
  );
}
