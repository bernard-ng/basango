import z from "zod";

import { categorySchema } from "./categories";
import { idSchema, paginationRequestSchema, sentimentSchema } from "./shared";
import { sourceSchema } from "./sources";

// schemas
export const articleHashSchema = z.string().regex(/^[a-f0-9]{32}$/, "Invalid article hash");

export const articleMetadataSchema = z.object({
  author: z.string().optional(),
  description: z.string().optional(),
  image: z.url().optional(),
  publishedAt: z.string().optional(),
  title: z.string().optional(),
  updatedAt: z.string().optional(),
  url: z.url().optional(),
});

export const tokenStatisticsSchema = z.object({
  body: z.number().optional().default(0),
  categories: z.number().optional().default(0),
  excerpt: z.number().optional().default(0),
  title: z.number().optional().default(0),
  total: z.number().optional().default(0),
});

export const articleSchema = z.object({
  body: z.string().min(1),
  categories: z.array(z.string()).optional().default([]),
  category: categorySchema.optional(),
  categoryId: idSchema.optional(),
  clustered: z.boolean().default(false),
  createdAt: z.coerce.date(),
  excerpt: z.string().optional(),
  hash: articleHashSchema,
  id: idSchema,
  image: z.url().optional(),
  link: z.url(),
  metadata: articleMetadataSchema.optional(),
  publishedAt: z.date(),
  readingTime: z.number().int().min(1),
  source: sourceSchema.optional(),
  sourceId: z.union([z.uuid(), z.string().min(1)]),
  title: z.string().min(1),
  tokenStatistics: tokenStatisticsSchema.optional(),
  updatedAt: z.coerce.date().optional(),
});

// API
export const createArticleSchema = z.object({
  body: z.string().min(1),
  categories: z.array(z.string()).optional().default([]),
  hash: articleHashSchema,
  link: z.url(),
  metadata: articleMetadataSchema.optional(),
  publishedAt: z.coerce.date(),
  sourceId: z.string(),
  title: z.string().min(1),
});

export const createArticleResponseSchema = z.object({
  created: z.boolean(),
  id: idSchema,
  sourceId: idSchema,
});

export const getArticleSchema = z.object({
  id: idSchema,
});

export const getArticlesSchema = paginationRequestSchema.extend({
  category: z.string().min(1).max(255).optional(),
  sentiment: sentimentSchema.optional(),
  sourceId: idSchema.optional(),
});

export const searchArticlesSchema = paginationRequestSchema.extend({
  categoryId: idSchema.optional(),
  facets: z
    .array(z.enum(["sourceId", "categoryId", "sentiment"]))
    .max(3)
    .optional(),
  publishedAfter: z.coerce.date().optional(),
  publishedBefore: z.coerce.date().optional(),
  query: z.string().trim().min(1).max(512),
  sentiment: sentimentSchema.optional(),
  sourceId: idSchema.optional(),
});

// types
export type Article = z.infer<typeof articleSchema>;
export type ArticleMetadata = z.infer<typeof articleMetadataSchema>;
export type TokenStatistics = z.infer<typeof tokenStatisticsSchema>;
export type SearchArticles = z.infer<typeof searchArticlesSchema>;
