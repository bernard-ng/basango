import { z } from "zod";

export const SEARCH_FACETS = ["sourceId", "categoryId", "sentiment"] as const;

export const searchFacetSchema = z.enum(SEARCH_FACETS);

export type SearchFacet = z.infer<typeof searchFacetSchema>;

export const searchSentimentSchema = z.enum(["negative", "neutral", "positive"]);

export type SearchSentiment = z.infer<typeof searchSentimentSchema>;

export const searchFiltersSchema = z.object({
  categoryId: z.string().optional(),
  publishedAfter: z.date().optional(),
  publishedBefore: z.date().optional(),
  sentiment: searchSentimentSchema.optional(),
  sourceId: z.string().optional(),
});

export type SearchFilters = z.infer<typeof searchFiltersSchema>;

export const searchRequestSchema = searchFiltersSchema.extend({
  facets: z.array(searchFacetSchema).readonly().optional(),
  limit: z.number().int().positive(),
  page: z.number().int().positive(),
  query: z.string(),
});

export type SearchRequest = z.infer<typeof searchRequestSchema>;

const searchCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
});

const searchSourceSchema = z.object({
  displayName: z.string().nullable(),
  id: z.string(),
  name: z.string(),
  url: z.url(),
});

export const searchHighlightSchema = z.object({
  highlighted: z.boolean(),
  text: z.string(),
});

export type SearchHighlight = z.infer<typeof searchHighlightSchema>;

export const searchHitSchema = z.object({
  categories: z.array(z.string()),
  category: searchCategorySchema.nullable(),
  excerpt: z.string().nullable(),
  highlights: z.object({
    excerpt: z.array(searchHighlightSchema),
    title: z.array(searchHighlightSchema),
  }),
  id: z.string(),
  image: z.url().nullable(),
  link: z.url(),
  publishedAt: z.date(),
  readingTime: z.number().nonnegative().nullable(),
  score: z.number().min(0).max(1),
  sentiment: searchSentimentSchema,
  source: searchSourceSchema,
  title: z.string(),
});

export type SearchHit = z.infer<typeof searchHitSchema>;

const facetCountsSchema = z.record(z.string(), z.number().int().nonnegative());

export const searchResultSchema = z.object({
  facets: z.partialRecord(searchFacetSchema, facetCountsSchema),
  items: z.array(searchHitSchema),
  meta: z.object({
    current: z.number().int().positive(),
    hasNext: z.boolean(),
    hasPrevious: z.boolean(),
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    pages: z.number().int().positive(),
    total: z.number().int().nonnegative(),
  }),
});

export type SearchResult = z.infer<typeof searchResultSchema>;

export const searchDocumentSchema = z.object({
  body: z.string(),
  categories: z.array(z.string()),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  categorySlug: z.string().nullable(),
  excerpt: z.string().nullable(),
  id: z.string(),
  image: z.url().nullable(),
  link: z.url(),
  publishedAt: z.iso.datetime(),
  publishedAtTimestamp: z.number().int(),
  readingTime: z.number().nonnegative().nullable(),
  sentiment: searchSentimentSchema,
  sourceDisplayName: z.string().nullable(),
  sourceId: z.string(),
  sourceName: z.string(),
  sourceUrl: z.url(),
  title: z.string(),
});

export type SearchDocument = z.infer<typeof searchDocumentSchema>;

export const indexVerificationSchema = z.object({
  documentCount: z.number().int().nonnegative(),
  indexName: z.string(),
});

export type IndexVerification = z.infer<typeof indexVerificationSchema>;
