import { logger } from "@basango/logger";
import { asc, desc, eq, sql } from "drizzle-orm";

import type { Database } from "#db/client";
import { markArticleSearchDirty } from "#db/queries/search-documents";
import { articles, categories } from "#db/schema";
import { DEFAULT_CATEGORY } from "#domain/constants";
import { Categories } from "#domain/models";

type CategoryRow = typeof categories.$inferSelect;
type ArticleCategories = Pick<typeof articles.$inferSelect, "categories" | "id">;
type ClassifierCategory = Pick<CategoryRow, "candidates" | "id" | "name" | "slug" | "weight">;

type CategoryScore = {
  category: ClassifierCategory;
  matches: number;
  score: number;
};

const BATCH_SIZE = 50_000;
const FALLBACK_CATEGORY = Categories.find((category) => category.slug === DEFAULT_CATEGORY)!;

export class CategoryClassifier {
  constructor(private readonly db: Database) {}

  async classifyPendingArticles(limit: number = BATCH_SIZE) {
    const configured = await getClassificationCategories(this.db);
    const categoryMap = new Map(configured.map((category) => [category.slug, category]));

    if (categoryMap.size === 0) {
      logger.warn("No categories available for clustering");
      return { matched: 0, processed: 0, unmatched: 0 };
    }

    const pending = await this.db
      .select({
        categories: articles.categories,
        id: articles.id,
      })
      .from(articles)
      .where(eq(articles.clustered, false))
      .orderBy(desc(articles.publishedAt), desc(articles.id))
      .limit(limit);

    if (pending.length === 0) {
      logger.info("No articles to cluster");
      return { matched: 0, processed: 0, unmatched: 0 };
    }

    let matched = 0;
    let unmatched = 0;

    for (const article of pending) {
      const best = classifyCategory(article, configured);
      const targetRow = categoryMap.get(best.category.slug);

      await this.db.transaction(async (tx) => {
        await tx
          .update(articles)
          .set({
            categoryId: targetRow?.id ?? null,
            clustered: true,
            updatedAt: sql`now()`,
          })
          .where(eq(articles.id, article.id));
        await markArticleSearchDirty(tx, [article.id]);
      });

      if (targetRow) {
        matched++;
        logger.debug(
          {
            articleId: article.id,
            category: best.category.slug,
            matches: best.matches,
            score: best.score,
          },
          "Clustered article",
        );
      } else {
        unmatched++;
        logger.debug({ articleId: article.id }, "No category match found");
      }
    }

    const processed = pending.length;
    logger.info({ matched, processed, unmatched }, "Category clustering run completed");
    return { matched, processed, unmatched };
  }
}

export async function classifyArticleCategory(
  db: Database,
  article: ArticleCategories,
): Promise<CategoryRow> {
  const configured = await getClassificationCategories(db);
  const best = classifyCategory(article, configured);
  const category = configured.find((item) => item.slug === best.category.slug);

  if (!category) {
    throw new Error("No category is available for article classification");
  }

  return category;
}

export function classifyCategory(
  article: ArticleCategories,
  configured: readonly ClassifierCategory[] = Categories,
): CategoryScore {
  const fallback =
    configured.find((category) => category.slug === DEFAULT_CATEGORY) ??
    [...configured].sort((left, right) => left.weight - right.weight)[0] ??
    FALLBACK_CATEGORY;
  const categoryOrder = new Map(configured.map((category, index) => [category.slug, index]));
  const candidateMap = buildCandidateMap(configured);
  const rawCategories = article.categories ?? [];
  const normalizedCategories = Array.from(
    new Set(
      rawCategories
        .map((value) => normalizeCategory(value))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const scores = new Map<string, CategoryScore>();

  for (const normalized of normalizedCategories) {
    const categories = candidateMap.get(normalized);
    if (!categories) continue;

    for (const category of categories) {
      const current =
        scores.get(category.slug) ??
        ({
          category,
          matches: 0,
          score: 0,
        } satisfies CategoryScore);

      current.matches += 1;
      current.score += category.weight;
      scores.set(category.slug, current);
    }
  }

  if (scores.size === 0) {
    return { category: fallback, matches: 0, score: 0 };
  }

  const [first, ...rest] = Array.from(scores.values());

  const best = rest.reduce<CategoryScore>((winner, candidate) => {
    if (candidate.score !== winner.score) {
      return candidate.score > winner.score ? candidate : winner;
    }

    if (candidate.category.weight !== winner.category.weight) {
      return candidate.category.weight > winner.category.weight ? candidate : winner;
    }

    if (candidate.matches !== winner.matches) {
      return candidate.matches > winner.matches ? candidate : winner;
    }

    const winnerOrder = categoryOrder.get(winner.category.slug) ?? Number.MAX_SAFE_INTEGER;
    const candidateOrder = categoryOrder.get(candidate.category.slug) ?? Number.MAX_SAFE_INTEGER;

    return candidateOrder < winnerOrder ? candidate : winner;
  }, first ?? { category: fallback, matches: 0, score: 0 });

  return best;
}

async function getClassificationCategories(db: Database): Promise<CategoryRow[]> {
  let configured = await db.query.categories.findMany({
    orderBy: [desc(categories.weight), asc(categories.name)],
  });

  if (configured.length > 0) {
    return configured;
  }

  const payload = Categories.map(
    (category) =>
      ({
        candidates: category.candidates,
        description: category.description ?? null,
        embeddings: null,
        id: category.id,
        name: category.name,
        slug: category.slug,
        weight: category.weight,
      }) satisfies typeof categories.$inferInsert,
  );

  await db.insert(categories).values(payload).onConflictDoNothing();
  configured = await db.query.categories.findMany({
    orderBy: [desc(categories.weight), asc(categories.name)],
  });

  return configured;
}

function buildCandidateMap(
  configured: readonly ClassifierCategory[],
): Map<string, ClassifierCategory[]> {
  const map = new Map<string, ClassifierCategory[]>();

  for (const category of configured) {
    for (const candidate of category.candidates) {
      const normalized = normalizeCategory(candidate);
      if (!normalized) continue;

      const existing = map.get(normalized) ?? [];
      if (!existing.some((item) => item.slug === category.slug)) {
        existing.push(category);
      }
      map.set(normalized, existing);
    }
  }

  return map;
}

export function normalizeCategory(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  return normalized.length > 0 ? normalized : null;
}
