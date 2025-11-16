import { Source } from "@basango/domain/models/sources";
import { Button } from "@basango/ui/components/button";
import { PlusIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { SourceCreateModal } from "#dashboard/components/modals/source-create-modal";
import { PageLayout } from "#dashboard/components/shell/page-layout";
import { SourceCard } from "#dashboard/components/source-card";
import { HydrateClient, getQueryClient, prefetch, trpc } from "#dashboard/trpc/server";

export const metadata: Metadata = {
  title: "Sources | Basango Dashboard",
};

export default async function Page() {
  const queryClient = getQueryClient();

  prefetch(trpc.sources.get.queryOptions());
  const sources: Source[] = await queryClient.fetchQuery(trpc.sources.get.queryOptions());

  return (
    <HydrateClient>
      <PageLayout leading="Manage your news sources" title="Sources">
        <div className="mb-6 flex justify-end">
          <Link href="?createSource=true">
            <Button type="button">
              <PlusIcon className="mr-2 size-4" />
              Add source
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {sources.map((source: Source) => (
            <Link href={`/sources/${source.id}`} key={source.id}>
              <SourceCard source={source} />
            </Link>
          ))}
        </div>

        <SourceCreateModal />
      </PageLayout>
    </HydrateClient>
  );
}
