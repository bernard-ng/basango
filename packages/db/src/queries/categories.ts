import { DEFAULT_CATEGORY } from "@basango/domain/constants";
import type { CreateCategory, ID, UpdateCategory } from "@basango/domain/models";
import { asc, count, desc, eq, getTableColumns, sql } from "drizzle-orm";
import * as uuid from "uuid";

import type { Database } from "#db/client";
import { NotFoundError } from "#db/errors";
import { markCategoryArticleSearchDirty } from "#db/queries/search-documents";
import { articles, categories } from "#db/schema";
import { normalizeCategory } from "#db/services/category-classifier";

export async function getCategories(db: Database) {
  return db
    .select({
      ...getTableColumns(categories),
      articleCount: count(articles.id),
    })
    .from(categories)
    .leftJoin(articles, eq(articles.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(desc(categories.weight), asc(categories.name));
}

export async function createCategory(db: Database, params: CreateCategory) {
  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(categories)
      .values({
        ...params,
        candidates: normalizeCandidates(params.candidates),
        id: uuid.v7(),
      })
      .returning();

    if (!created) {
      throw new Error("Category could not be created.");
    }

    await tx.update(articles).set({ clustered: false, updatedAt: sql`now()` });

    return created;
  });
}

export async function updateCategory(db: Database, params: UpdateCategory) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.categories.findFirst({
      where: eq(categories.id, params.id),
    });

    if (!existing) {
      throw new NotFoundError("Category not found");
    }

    const candidates = normalizeCandidates(params.candidates);
    const [updated] = await tx
      .update(categories)
      .set({
        candidates,
        description: params.description,
        name: params.name,
        slug: params.slug,
        updatedAt: new Date(),
        weight: params.weight,
      })
      .where(eq(categories.id, params.id))
      .returning();

    await markCategoryArticleSearchDirty(tx, params.id);

    const classificationChanged =
      existing.slug !== params.slug ||
      existing.weight !== params.weight ||
      !sameCandidates(existing.candidates, candidates);

    if (classificationChanged) {
      await tx.update(articles).set({ clustered: false, updatedAt: sql`now()` });
    }

    return updated;
  });
}

export async function deleteCategory(db: Database, id: ID) {
  return db.transaction(async (tx) => {
    const [countRow] = await tx.select({ value: count(categories.id) }).from(categories);

    if ((countRow?.value ?? 0) <= 1) {
      throw new Error("The last category cannot be deleted.");
    }

    await markCategoryArticleSearchDirty(tx, id);
    const [deleted] = await tx.delete(categories).where(eq(categories.id, id)).returning();

    if (!deleted) {
      throw new NotFoundError("Category not found");
    }

    await tx.update(articles).set({ clustered: false, updatedAt: sql`now()` });

    return deleted;
  });
}

export async function getClusteringStats(db: Database) {
  const [summaryRows, categoryRows, rawCandidateRows] = await Promise.all([
    db
      .select({
        clustered: sql<number>`count(*) filter (where ${articles.clustered} = true)::int`,
        pending: sql<number>`count(*) filter (where ${articles.clustered} = false)::int`,
        total: sql<number>`count(*)::int`,
        unassigned: sql<number>`count(*) filter (where ${articles.categoryId} is null)::int`,
      })
      .from(articles),
    db
      .select({
        articleCount: count(articles.id),
        candidates: categories.candidates,
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories)
      .leftJoin(articles, eq(articles.categoryId, categories.id))
      .groupBy(categories.id)
      .orderBy(desc(count(articles.id)), asc(categories.name)),
    db.execute<{ candidate: string; count: number }>(sql`
      select trim(source_category) as candidate, count(*)::int as count
      from ${articles}
      cross join lateral unnest(coalesce(${articles.categories}, array[]::text[])) as source_category
      where trim(source_category) <> ''
      group by trim(source_category)
      order by count(*) desc, trim(source_category) asc
    `),
  ]);
  const summary = summaryRows[0] ?? { clustered: 0, pending: 0, total: 0, unassigned: 0 };
  const knownCandidates = new Set(
    categoryRows.flatMap((category) =>
      category.candidates
        .map((candidate) => normalizeCategory(candidate))
        .filter((candidate): candidate is string => Boolean(candidate)),
    ),
  );
  const unknownCandidates = rawCandidateRows.rows.filter((row) => {
    const normalized = normalizeCategory(row.candidate);

    return normalized !== null && !knownCandidates.has(normalized);
  });
  const fallbackCategory = categoryRows.find((category) => category.slug === DEFAULT_CATEGORY);
  const clusteringPercent =
    summary.total === 0 ? 0 : Math.round((summary.clustered / summary.total) * 100);

  return {
    ...summary,
    categories: categoryRows.map(({ candidates: _candidates, ...category }) => category),
    clusteringPercent,
    fallbackAssignments: fallbackCategory?.articleCount ?? 0,
    unknownCandidates,
  };
}

function normalizeCandidates(values: readonly string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function sameCandidates(left: readonly string[], right: readonly string[]): boolean {
  const normalizedLeft = left
    .map((value) => normalizeCategory(value))
    .filter((value): value is string => value !== null)
    .sort();
  const normalizedRight = right
    .map((value) => normalizeCategory(value))
    .filter((value): value is string => value !== null)
    .sort();

  return (
    normalizedLeft.length === normalizedRight.length &&
    normalizedLeft.every((value, index) => value === normalizedRight[index])
  );
}
