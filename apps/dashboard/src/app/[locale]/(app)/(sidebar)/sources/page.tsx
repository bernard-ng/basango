import { Button } from "@basango/ui/components/button";
import { PlusIcon } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { RouterOutputs } from "#api/trpc/routers/_app";
import { SourceCreateModal } from "#dashboard/components/modals/source-create-modal";
import { PageLayout } from "#dashboard/components/shell/page-layout";
import { SourceCard } from "#dashboard/components/source-card";
import { HydrateClient, getQueryClient, prefetch, trpc } from "#dashboard/trpc/server";

export const metadata: Metadata = {
  title: "Sources | Basango Dashboard",
};

type Source = RouterOutputs["sources"]["list"][number];

export default async function Page() {
  const queryClient = getQueryClient();

  prefetch(trpc.sources.list.queryOptions());
  const sources = await queryClient.fetchQuery(trpc.sources.list.queryOptions());

  return (
    <HydrateClient>
      <PageLayout title="Sources">
        <div className="flex justify-end">
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
