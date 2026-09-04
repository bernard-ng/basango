import type { Index } from "meilisearch";
import { z } from "zod";

import {
  type SearchEngine,
  type SearchFacet,
  type SearchHit,
  type SearchRequest,
  type SearchResult,
  searchHitSchema,
  searchRequestSchema,
  searchResultSchema,
} from "../engine";
import { type SearchDocument, searchDocumentSchema } from "../indexer";
import { ARTICLE_RETRIEVED_ATTRIBUTES } from "./settings";

const HIGHLIGHT_START = "\uE000";
const HIGHLIGHT_END = "\uE001";

const meilisearchFormattedSchema = z.object({
  excerpt: z.string().nullable().optional(),
  title: z.string().optional(),
});

const meilisearchHitSchema = searchDocumentSchema
  .omit({ body: true, publishedAtTimestamp: true })
  .extend({
    _formatted: meilisearchFormattedSchema.optional(),
    _rankingScore: z.number().min(0).max(1).optional(),
  })
  .transform(
    (hit) =>
      ({
        categories: hit.categories,
        category:
          hit.categoryId !== null && hit.categoryName !== null && hit.categorySlug !== null
            ? { id: hit.categoryId, name: hit.categoryName, slug: hit.categorySlug }
            : null,
        excerpt: hit.excerpt,
        highlights: {
          excerpt: parseHighlights(hit._formatted?.excerpt ?? hit.excerpt ?? ""),
          title: parseHighlights(hit._formatted?.title ?? hit.title),
        },
        id: hit.id,
        image: hit.image,
        link: hit.link,
        publishedAt: new Date(hit.publishedAt),
        readingTime: hit.readingTime,
        score: hit._rankingScore ?? 0,
        sentiment: hit.sentiment,
        source: {
          displayName: hit.sourceDisplayName,
          id: hit.sourceId,
          name: hit.sourceName,
          url: hit.sourceUrl,
        },
        title: hit.title,
      }) satisfies SearchHit,
  )
  .pipe(searchHitSchema);

const meilisearchResponseSchema = z.object({
  facetDistribution: z
    .record(z.string(), z.record(z.string(), z.number().int().nonnegative()))
    .optional(),
  hits: z.array(meilisearchHitSchema),
  totalHits: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative(),
});

export class MeilisearchEngine implements SearchEngine {
  constructor(private readonly index: Index<SearchDocument>) {}

  async search(request: SearchRequest): Promise<SearchResult> {
    const validatedRequest = searchRequestSchema.parse(request);
    const facets = validatedRequest.facets ?? [];
    const response = meilisearchResponseSchema.parse(
      await this.index.search(validatedRequest.query, {
        attributesToCrop: ["excerpt"],
        attributesToHighlight: ["title", "excerpt"],
        attributesToRetrieve: [...ARTICLE_RETRIEVED_ATTRIBUTES],
        cropLength: 36,
        facets: [...facets],
        filter: buildSearchFilters(validatedRequest),
        highlightPostTag: HIGHLIGHT_END,
        highlightPreTag: HIGHLIGHT_START,
        hitsPerPage: validatedRequest.limit,
        page: validatedRequest.page,
        showRankingScore: true,
      }),
    );
    const total = response.totalHits;
    const pages = Math.max(response.totalPages, 1);

    return searchResultSchema.parse({
      facets: normalizeFacets(response.facetDistribution, facets),
      items: response.hits,
      meta: {
        current: validatedRequest.page,
        hasNext: validatedRequest.page < pages,
        hasPrevious: validatedRequest.page > 1,
        limit: validatedRequest.limit,
        offset: (validatedRequest.page - 1) * validatedRequest.limit,
        pages,
        total,
      },
    });
  }
}

export function parseHighlights(
  value: string,
): SearchResult["items"][number]["highlights"]["title"] {
  const highlights: SearchResult["items"][number]["highlights"]["title"] = [];
  let remaining = value;

  while (remaining.length > 0) {
    const start = remaining.indexOf(HIGHLIGHT_START);

    if (start === -1) {
      highlights.push({ highlighted: false, text: remaining });
      break;
    }

    if (start > 0) {
      highlights.push({ highlighted: false, text: remaining.slice(0, start) });
    }

    const matchStart = start + HIGHLIGHT_START.length;
    const end = remaining.indexOf(HIGHLIGHT_END, matchStart);

    if (end === -1) {
      highlights.push({ highlighted: false, text: remaining.slice(start) });
      break;
    }

    highlights.push({ highlighted: true, text: remaining.slice(matchStart, end) });
    remaining = remaining.slice(end + HIGHLIGHT_END.length);
  }

  return highlights;
}

export function buildSearchFilters(request: SearchRequest): string[] {
  const filters: string[] = [];

  if (request.sourceId) {
    filters.push(`sourceId = ${quoteFilterValue(request.sourceId)}`);
  }

  if (request.categoryId) {
    filters.push(`categoryId = ${quoteFilterValue(request.categoryId)}`);
  }

  if (request.sentiment) {
    filters.push(`sentiment = ${quoteFilterValue(request.sentiment)}`);
  }

  if (request.publishedAfter) {
    filters.push(`publishedAtTimestamp >= ${toTimestamp(request.publishedAfter)}`);
  }

  if (request.publishedBefore) {
    filters.push(`publishedAtTimestamp <= ${toTimestamp(request.publishedBefore)}`);
  }

  return filters;
}

export function quoteFilterValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function normalizeFacets(
  value: Record<string, Record<string, number>> | undefined,
  requested: readonly SearchFacet[],
): SearchResult["facets"] {
  const facets: SearchResult["facets"] = {};

  for (const name of requested) {
    const distribution = value?.[name];

    if (distribution && Object.keys(distribution).length > 0) {
      facets[name] = distribution;
    }
  }

  return facets;
}

function toTimestamp(value: Date): number {
  return Math.floor(value.getTime() / 1000);
}
