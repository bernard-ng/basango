import z from "zod";

import { idSchema, sentimentSchema } from "./shared";
import { sourceSchema } from "./sources";

// schemas
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
  categories: z.array(z.string()),
  createdAt: z.coerce.date(),
  excerpt: z.string().optional(),
  hash: z.string().min(1),
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
  hash: z.string().min(1),
  link: z.url(),
  metadata: articleMetadataSchema.optional(),
  publishedAt: z.coerce.date(),
  sourceId: z.string(),
  title: z.string().min(1),
});

export const createArticleResponseSchema = z.object({ id: idSchema, sourceId: idSchema });

export const getArticlesSchema = z.object({
  category: z.string().min(1).max(255).optional(),
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(100).optional(),
  search: z.string().max(512).optional(),
  sentiment: sentimentSchema.optional(),
  sourceId: idSchema.optional(),
});

// types
export type Article = z.infer<typeof articleSchema>;
export type ArticleMetadata = z.infer<typeof articleMetadataSchema>;
export type TokenStatistics = z.infer<typeof tokenStatisticsSchema>;
