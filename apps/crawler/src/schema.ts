import { z } from "zod";

export const UpdateDirectionSchema = z.enum(["forward", "backward"]);
export const SourceKindSchema = z.enum(["wordpress", "html"]);

export const DateRangeSchema = z
  .object({
    end: z.number().int(),
    start: z.number().int(),
  })
  .superRefine((value, ctx) => {
    if (value.start === 0 || value.end === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Timestamp cannot be zero",
      });
    }
    if (value.end < value.start) {
      ctx.addIssue({
        code: "custom",
        message: "End timestamp must be greater than or equal to start",
      });
    }
  });

export const PageRangeSchema = z
  .object({
    end: z.number().int().min(0),
    start: z.number().int().min(0),
  })
  .superRefine((value, ctx) => {
    if (value.end < value.start) {
      ctx.addIssue({
        code: "custom",
        message: "End page must be greater than or equal to start page",
      });
    }
  });

export const PageRangeSpecSchema = z
  .string()
  .regex(/^[0-9]+:[0-9]+$/, "Invalid page range format. Use start:end")
  .transform((spec) => {
    const [startText, endText] = spec.split(":");
    return {
      end: Number.parseInt(String(endText), 10),
      start: Number.parseInt(String(startText), 10),
    };
  });

export const DateRangeSpecSchema = z
  .string()
  .regex(/.+:.+/, "Expected start:end format")
  .transform((spec) => {
    const [startRaw, endRaw] = spec.split(":");
    return { endRaw: String(endRaw), startRaw: String(startRaw) };
  });

export const SourceDateSchema = z.object({
  format: z.string().default("yyyy-LL-dd HH:mm"),
  pattern: z.string().nullable().optional(),
  replacement: z.string().nullable().optional(),
});

const BaseSourceSchema = z.object({
  categories: z.array(z.string()).default([]),
  requiresDetails: z.boolean().default(false),
  requiresRateLimit: z.boolean().default(false),
  sourceDate: SourceDateSchema,
  sourceId: z.string(),
  sourceKind: SourceKindSchema,
  sourceUrl: z.url(),
  supportsCategories: z.boolean().default(false),
});

export const HtmlSourceConfigSchema = BaseSourceSchema.extend({
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

export const WordPressSourceConfigSchema = BaseSourceSchema.extend({
  sourceDate: SourceDateSchema.default(SourceDateSchema.parse({ format: "yyyy-LL-dd'T'HH:mm:ss" })),
  sourceKind: z.literal("wordpress"),
});

export const ArticleMetadataSchema = z.object({
  description: z.string().optional(),
  image: z.string().optional(),
  title: z.string().optional(),
  url: z.url().optional(),
});

export const ArticleTokenStatisticsSchema = z.object({
  body: z.number().int().nonnegative().default(0),
  categories: z.number().int().nonnegative().default(0),
  excerpt: z.number().int().nonnegative().default(0),
  title: z.number().int().nonnegative().default(0),
});

export const ArticleSchema = z.object({
  body: z.string(),
  categories: z.array(z.string()).default([]),
  hash: z.string().optional(),
  link: z.url(),
  metadata: ArticleMetadataSchema.optional(),
  source: z.string(),
  timestamp: z.number().int(),
  title: z.string(),
  tokenStatistics: ArticleTokenStatisticsSchema.optional(),
});

export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type PageRange = z.infer<typeof PageRangeSchema>;
export type HtmlSourceConfig = z.infer<typeof HtmlSourceConfigSchema>;
export type WordPressSourceConfig = z.infer<typeof WordPressSourceConfigSchema>;
export type AnySourceConfig = HtmlSourceConfig | WordPressSourceConfig;

export interface CreateDateRangeOptions {
  format?: string;
  separator?: string;
}
