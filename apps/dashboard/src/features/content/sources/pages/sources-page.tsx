import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { buttonVariants } from "@basango/ui/components/button";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";
import { OffsetPagination } from "#dashboard/features/content/shared/components/offset-pagination";

import { SourceCard } from "../components/source-card";
import { SourceCreateDialog } from "../dialogs/source-create-dialog";

const SOURCE_PAGE_SIZE = 6;

export function SourcesPage() {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const sources = useQuery({
    ...trpc.sources.list.queryOptions({ limit: SOURCE_PAGE_SIZE, page }),
    placeholderData: keepPreviousData,
  });
  const pagination = sources.data?.meta;

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
      {sources.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load sources</AlertTitle>
          <AlertDescription>{sources.error.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sources.data?.items.map((source) => (
          <Link key={source.id} params={{ id: source.id }} search={{}} to="/sources/$id">
            <SourceCard source={source} />
          </Link>
        ))}
      </div>

      {pagination ? (
        <OffsetPagination
          currentPage={pagination.current}
          isFetching={sources.isFetching}
          itemLabel="source"
          onPageChange={setPage}
          pageCount={pagination.pages}
          total={pagination.total}
        />
      ) : null}

      <SourceCreateDialog />
    </PageLayout>
  );
}
