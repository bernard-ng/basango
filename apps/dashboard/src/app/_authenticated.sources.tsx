import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Button } from "@basango/ui/components/button";
import { Link, createFileRoute } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { SourceCreateModal } from "#dashboard/components/modals/source-create-modal";
import { PageLayout } from "#dashboard/components/shell/page-layout";
import { SourceCard } from "#dashboard/components/source-card";

type Source = RouterOutputs["sources"]["list"][number];

export const Route = createFileRoute("/_authenticated/sources")({
  component: SourcesPage,
  head: () => ({
    meta: [{ title: "Sources | Basango Dashboard" }],
  }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.sources.list.queryOptions()),
  validateSearch: (search): { createSource?: boolean } =>
    search.createSource === true || search.createSource === "true" ? { createSource: true } : {},
});

function SourcesPage() {
  const sources = Route.useLoaderData();

  return (
    <PageLayout title="Sources">
      <div className="flex justify-end">
        <Link search={{ createSource: true }} to="/sources">
          <Button type="button">
            <PlusIcon className="mr-2 size-4" />
            Add source
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sources.map((source: Source) => (
          <Link key={source.id} params={{ id: source.id }} search={{}} to="/sources/$id">
            <SourceCard source={source} />
          </Link>
        ))}
      </div>

      <SourceCreateModal />
    </PageLayout>
  );
}
