import { z } from "zod";

import { SOURCE_KINDS } from "#domain/constants";

// schemas
export const SourceKindSchema = z.enum(SOURCE_KINDS);

export const SourceDateSchema = z.object({
  format: z.string().default("yyyy-LL-dd HH:mm"),
});

const SourceConfigSchema = z.object({
  categories: z.array(z.string()).default([]),
  requiresDetails: z.boolean().default(false),
  requiresRateLimit: z.boolean().default(false),
  sourceDate: SourceDateSchema,
  sourceId: z.string(),
  sourceKind: SourceKindSchema,
  sourceUrl: z.url(),
  supportsCategories: z.boolean().default(false),
});

export const HtmlSourceConfigSchema = SourceConfigSchema.extend({
  paginationTemplate: z.string(),
  sourceKind: z.literal("html"),
  sourceSelectors: z.object({
    articleBody: z.string(),
    articleCategories: z.string().optional(),
    articleDate: z.string(),
    articleLink: z.string(),
    articles: z.string(),
    articleTitle: z.string(),
    pagination: z.string().default("ul.pagination > li a"),
  }),
});

export const WordPressSourceConfigSchema = SourceConfigSchema.extend({
  sourceDate: SourceDateSchema.default(SourceDateSchema.parse({ format: "yyyy-LL-dd'T'HH:mm:ss" })),
  sourceKind: z.literal("wordpress"),
});

// types
export type SourceKind = z.infer<typeof SourceKindSchema>;
export type SourceDate = z.infer<typeof SourceDateSchema>;
export type HtmlSourceConfig = z.infer<typeof HtmlSourceConfigSchema>;
export type WordPressSourceConfig = z.infer<typeof WordPressSourceConfigSchema>;
export type AnySourceConfig = HtmlSourceConfig | WordPressSourceConfig;
