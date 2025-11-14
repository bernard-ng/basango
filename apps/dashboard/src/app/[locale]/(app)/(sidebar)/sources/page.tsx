import { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Metadata } from "next";
import Link from "next/link";

import { PageLayout } from "#dashboard/components/shell/page-layout";
import { SourceCard } from "#dashboard/components/widgets/source-card";
import { HydrateClient, getQueryClient, prefetch, trpc } from "#dashboard/trpc/server";

export const metadata: Metadata = {
  title: "Sources | Basango Dashboard",
};

type SourceDetails = RouterOutputs["sources"]["get"][number];

export default async function Page() {
  const queryClient = getQueryClient();

  prefetch(trpc.sources.get.queryOptions());
  const sources = await queryClient.fetchQuery(trpc.sources.get.queryOptions());

  return (
    <HydrateClient>
      <PageLayout leading="Manage your news sources" title="Sources">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {sources.map((source: SourceDetails) => (
            <Link href={`/sources/${source.id}`} key={source.id}>
              <SourceCard source={source} />
            </Link>
          ))}
        </div>
      </PageLayout>
    </HydrateClient>
  );
}
