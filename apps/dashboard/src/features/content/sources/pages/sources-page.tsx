import { buttonVariants } from "@basango/ui/components/button";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";

import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";

import { SourceCard } from "../components/source-card";
import { SourceCreateDialog } from "../dialogs/source-create-dialog";

export function SourcesPage() {
  const trpc = useTRPC();
  const { data: sources } = useSuspenseQuery(trpc.sources.list.queryOptions());

  return (
    <PageLayout
      actions={
        <Link className={buttonVariants()} search={{ createSource: true }} to="/sources">
          <PlusIcon data-icon="inline-start" />
          Add source
        </Link>
      }
      description="Manage the publications Basango monitors and ingests."
      title="Sources"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sources.map((source) => (
          <Link key={source.id} params={{ id: source.id }} search={{}} to="/sources/$id">
            <SourceCard source={source} />
          </Link>
        ))}
      </div>

      <SourceCreateDialog />
    </PageLayout>
  );
}
