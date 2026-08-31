import z from "zod";

import {
  credibilitySchema,
  idSchema,
  limitSchema,
  paginationRequestSchema,
  publicationsSchema,
} from "./shared";

export const CRAWLER_SOURCE_KINDS = ["html", "wordpress"] as const;

// schemas
export const sourceSchema = z.object({
  articles: z.number().int().min(0).optional(),
  coveragePercent: z.number().int().min(0).max(100).nullable().optional(),
  coverageUpdatedAt: z.coerce.date().nullable().optional(),
  credibility: credibilitySchema.optional(),
  description: z.string().max(1024).optional(),
  displayName: z.string().min(1).max(255).optional(),
  estimatedArticles: z.number().int().nonnegative().nullable().optional(),
  id: idSchema,
  name: z.string().min(1).max(255),
  publications: publicationsSchema.optional(),
  url: z.url().max(255),
});

export const createSourceSchema = sourceSchema.pick({
  description: true,
  displayName: true,
  name: true,
  url: true,
});

export const getSourceSchema = z.object({
  id: idSchema,
});

export const deleteSourceSchema = getSourceSchema;

export const getSourcesSchema = paginationRequestSchema;

export const getCategorySharesSchema = z.object({
  id: idSchema,
  limit: limitSchema.optional(),
});

export const updateSourceSchema = sourceSchema.pick({
  credibility: true,
  description: true,
  displayName: true,
  id: true,
  name: true,
  url: true,
});

export const getSourcePublicationBoundsSchema = z.object({
  name: z.string().min(1).max(255),
});

export const getSourcePublicationBoundsResponseSchema = z.object({
  earliest: z.coerce.date().nullable(),
  latest: z.coerce.date().nullable(),
});

export const crawlerSourceSyncItemSchema = z.object({
  estimatedArticles: z.number().int().nonnegative().optional(),
  kind: z.enum(CRAWLER_SOURCE_KINDS),
  name: z.string().trim().min(1).max(255),
  url: z.url().max(255),
});

export const syncCrawlerSourcesSchema = z.object({
  sources: z.array(crawlerSourceSyncItemSchema).min(1).max(500),
});

export const syncCrawlerSourcesResponseSchema = z.object({
  created: z.number().int().nonnegative(),
  updated: z.number().int().nonnegative(),
});

// types
export type CrawlerSourceSyncItem = z.infer<typeof crawlerSourceSyncItemSchema>;
export type Source = z.infer<typeof sourceSchema>;
export type SourcePublicationBounds = z.infer<typeof getSourcePublicationBoundsResponseSchema>;
export type SyncCrawlerSources = z.infer<typeof syncCrawlerSourcesSchema>;

export function calculateSourceCoveragePercent(
  ingestedArticles: number,
  estimatedArticles: number | null | undefined,
): number | null {
  if (!estimatedArticles || estimatedArticles < 0) {
    return null;
  }

  return Math.min(100, Math.round((ingestedArticles / estimatedArticles) * 100));
}
