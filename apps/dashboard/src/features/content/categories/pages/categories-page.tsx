"use client";

import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import { Alert, AlertDescription, AlertTitle } from "@basango/ui/components/alert";
import { Button } from "@basango/ui/components/button";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { PageLayout } from "#dashboard/app/components/page-layout";
import { useTRPC } from "#dashboard/app/trpc/client";

import { CategoriesTable } from "../components/categories-table";
import type { CategoryRowAction } from "../components/category-row-actions";
import { ClusteringStats } from "../components/clustering-stats";
import { CategoryDeleteDialog } from "../dialogs/category-delete-dialog";
import { CategoryDialog } from "../dialogs/category-dialog";

type ManagedCategory = RouterOutputs["categories"]["list"][number];

export function CategoriesPage() {
  const trpc = useTRPC();
  const categories = useQuery(trpc.categories.list.queryOptions());
  const stats = useQuery(trpc.categories.stats.queryOptions());
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ManagedCategory>();
  const [deletingCategory, setDeletingCategory] = useState<ManagedCategory>();
  const error = categories.error ?? stats.error;

  function handleCategoryAction(action: CategoryRowAction, category: ManagedCategory) {
    if (action === "edit") {
      setEditingCategory(category);
      return;
    }

    setDeletingCategory(category);
  }

  return (
    <PageLayout
      actions={
        <Button onClick={() => setIsCreateOpen(true)}>
          <PlusIcon data-icon="inline-start" />
          Add category
        </Button>
      }
      description="Manage article categories, tune matching candidates, and monitor clustering quality."
      title="Categories"
    >
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Unable to load category management</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : null}

      {stats.data ? <ClusteringStats stats={stats.data} /> : null}

      <section className="space-y-4">
        <div>
          <h2 className="font-semibold text-lg">Category rules</h2>
          <p className="text-muted-foreground text-sm">
            Higher weights win when one article matches candidates from multiple categories.
          </p>
        </div>
        <CategoriesTable
          categories={categories.data ?? []}
          isLoading={categories.isPending}
          onAction={handleCategoryAction}
        />
      </section>

      <CategoryDialog onOpenChange={setIsCreateOpen} open={isCreateOpen} />

      {editingCategory ? (
        <CategoryDialog
          category={editingCategory}
          onOpenChange={(open) => {
            if (!open) {
              setEditingCategory(undefined);
            }
          }}
          open
        />
      ) : null}

      {deletingCategory ? (
        <CategoryDeleteDialog
          category={deletingCategory}
          onOpenChange={(open) => {
            if (!open) {
              setDeletingCategory(undefined);
            }
          }}
          open
        />
      ) : null}
    </PageLayout>
  );
}
