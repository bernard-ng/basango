import { z } from "zod";

export const UpdateDirectionSchema = z.enum(["forward", "backward"]);
export const SourceKindSchema = z.enum(["wordpress", "html"]);

export const DateRangeSchema = z
  .object({
    start: z.number().int(),
    end: z.number().int(),
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
    start: z.number().int().min(0),
    end: z.number().int().min(0),
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
      start: Number.parseInt(String(startText), 10),
      end: Number.parseInt(String(endText), 10),
    };
  });

export const DateRangeSpecSchema = z
  .string()
  .regex(/.+:.+/, "Expected start:end format")
  .transform((spec) => {
    const [startRaw, endRaw] = spec.split(":");
    return { startRaw: String(startRaw), endRaw: String(endRaw) };
  });

export const SourceDateSchema = z.object({
  format: z.string().default("yyyy-LL-dd HH:mm"),
  pattern: z.string().nullable().optional(),
  replacement: z.string().nullable().optional(),
});

const BaseSourceSchema = z.object({
  sourceId: z.string(),
  sourceUrl: z.url(),
  sourceDate: SourceDateSchema,
  sourceKind: SourceKindSchema,
  categories: z.array(z.string()).default([]),
  supportsCategories: z.boolean().default(false),
  requiresDetails: z.boolean().default(false),
  requiresRateLimit: z.boolean().default(false),
});

export const HtmlSourceConfigSchema = BaseSourceSchema.extend({
  sourceKind: z.literal("html"),
  sourceSelectors: z.object({
    articles: z.string(),
    articleTitle: z.string(),
    articleLink: z.string(),
    articleBody: z.string(),
    articleDate: z.string(),
    articleCategories: z.string().optional(),
    pagination: z.string().default("ul.pagination > li a"),
  }),
  paginationTemplate: z.string(),
});

export const WordPressSourceConfigSchema = BaseSourceSchema.extend({
  sourceKind: z.literal("wordpress"),
  sourceDate: SourceDateSchema.default(SourceDateSchema.parse({ format: "yyyy-LL-dd'T'HH:mm:ss" })),
});

export const ArticleMetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  url: z.url().optional(),
});

export const ArticleTokenStatisticsSchema = z.object({
  title: z.number().int().nonnegative().default(0),
  body: z.number().int().nonnegative().default(0),
  excerpt: z.number().int().nonnegative().default(0),
  categories: z.number().int().nonnegative().default(0),
});

export const ArticleSchema = z.object({
  title: z.string(),
  link: z.url(),
  body: z.string(),
  categories: z.array(z.string()).default([]),
  source: z.string(),
  timestamp: z.number().int(),
  metadata: ArticleMetadataSchema.optional(),
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
