import { Metadata } from "next";

import { PageLayout } from "@/components/shell/page-layout";
import { SourceCard } from "@/components/source-card";
import { batchPrefetch, getQueryClient, trpc } from "@/trpc/server";

export const metadata: Metadata = {
  title: "Sources | Basango Dashboard",
};

export default async function Page() {
  const queryClient = getQueryClient();

  batchPrefetch([trpc.sources.get.queryOptions()]);
  const sources = await queryClient.fetchQuery(trpc.sources.get.queryOptions());

  return (
    <PageLayout leading="Manage your news sources" title="Sources">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sources.map((source) => (
          <SourceCard key={source.id} {...source} />
        ))}
      </div>
    </PageLayout>
  );
}
