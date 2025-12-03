import { logger } from "@basango/logger";
import { desc, eq, inArray, sql } from "drizzle-orm";

import { Database } from "#db/client";
import { articles, categories } from "#db/schema";
import { DEFAULT_CATEGORY } from "#domain/constants";
import { Categories } from "#domain/models";

type CategoryRow = typeof categories.$inferSelect;
type ArticleCategories = Pick<typeof articles.$inferSelect, "categories" | "id">;

type CategoryScore = {
  category: (typeof Categories)[number];
  matches: number;
  score: number;
};

const BATCH_SIZE = 50_000;
const CATEGORY_MAP = new Map(Categories.map((category, index) => [category.slug, index]));
const CANDIDATE_MAP = buildCandidateMap();
const FALLBACK_CATEGORY = Categories.find((category) => category.slug === DEFAULT_CATEGORY)!;

export class CategoryClassifier {
  constructor(private readonly db: Database) {}

  async classifyPendingArticles(limit: number = BATCH_SIZE) {
    const canonical = await this.ensureCanonicalCategories();

    if (canonical.size === 0) {
      logger.warn("No canonical categories available for clustering");
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

    const fallbackRow = canonical.get(FALLBACK_CATEGORY.slug);

    for (const article of pending) {
      const best = classifyCategory(article);

      const targetRow = canonical.get(best.category.slug) ?? fallbackRow;

      await this.db
        .update(articles)
        .set({
          categoryId: targetRow?.id ?? null,
          clustered: true,
          updatedAt: sql`now()`,
        })
        .where(eq(articles.id, article.id));

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

  private async ensureCanonicalCategories(): Promise<Map<string, CategoryRow>> {
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

    await this.db.insert(categories).values(payload).onConflictDoNothing();

    const existing = await this.db.query.categories.findMany({
      where: inArray(
        categories.slug,
        Categories.map((category) => category.slug),
      ),
    });

    const map = new Map<string, CategoryRow>();

    for (const row of existing) {
      map.set(row.slug, row);
    }

    if (!map.has(FALLBACK_CATEGORY.slug)) {
      logger.warn("Fallback main category is missing from canonical categories");
    }

    return map;
  }
}

function classifyCategory(article: ArticleCategories): CategoryScore {
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
    const categories = CANDIDATE_MAP.get(normalized);
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
    return { category: FALLBACK_CATEGORY, matches: 0, score: 0 };
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

    const winnerOrder = CATEGORY_MAP.get(winner.category.slug) ?? Number.MAX_SAFE_INTEGER;
    const candidateOrder = CATEGORY_MAP.get(candidate.category.slug) ?? Number.MAX_SAFE_INTEGER;

    return candidateOrder < winnerOrder ? candidate : winner;
  }, first ?? { category: FALLBACK_CATEGORY, matches: 0, score: 0 });

  return best;
}

function buildCandidateMap(): Map<string, (typeof Categories)[number][]> {
  const map = new Map<string, (typeof Categories)[number][]>();

  for (const category of Categories) {
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
