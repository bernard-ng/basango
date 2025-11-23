import { z } from "zod";

import { SOURCE_KINDS } from "../constants";
import { PageRangeSchema, TimestampRangeSchema, UpdateDirectionSchema } from "../models";

export const SourceKindSchema = z.enum(SOURCE_KINDS);

export const SourceDateSchema = z.object({
  format: z.string().default("yyyy-LL-dd HH:mm"),
});

const SourceOptionsSchema = z.object({
  categories: z.array(z.string()).default([]),
  requiresDetails: z.boolean().default(false),
  requiresRateLimit: z.boolean().default(false),
  sourceDate: SourceDateSchema,
  sourceId: z.string(),
  sourceKind: SourceKindSchema,
  sourceUrl: z.url(),
  supportsCategories: z.boolean().default(false),
});

export const HtmlSourceOptionsSchema = SourceOptionsSchema.extend({
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

export const WordPressSourceOptionsSchema = SourceOptionsSchema.extend({
  sourceDate: SourceDateSchema.default(SourceDateSchema.parse({ format: "yyyy-LL-dd'T'HH:mm:ss" })),
  sourceKind: z.literal("wordpress"),
});

export const CrawlerConfigurationSchema = z.object({
  backend: z.object({
    endpoint: z.url(),
    token: z.string(),
  }),
  fetch: z.object({
    async: z.object({
      prefix: z.string().default("basango:crawler:queue"),
      queues: z.object({
        details: z.string().default("details"),
        listing: z.string().default("listing"),
        processing: z.string().default("processing"),
      }),
      redisUrl: z.string().default("redis://localhost:6379/0"),
      ttl: z.object({
        default: z.number().int().positive().default(600),
        failure: z.number().int().nonnegative().default(3600),
        result: z.number().int().nonnegative().default(3600),
      }),
    }),
    client: z.object({
      backoffInitial: z.number().nonnegative().default(1),
      backoffMax: z.number().nonnegative().default(30),
      backoffMultiplier: z.number().positive().default(2),
      followRedirects: z.boolean().default(true),
      maxRetries: z.number().int().nonnegative().default(3),
      respectRetryAfter: z.boolean().default(true),
      rotate: z.boolean().default(true),
      timeout: z.number().positive().default(20),
      userAgent: z.string().default("Basango/0.1 (+https://github.com/bernard-ng/basango)"),
      verifySsl: z.boolean().default(true),
    }),
    crawler: z.object({
      category: z.string().optional(),
      dateRange: TimestampRangeSchema.optional(),
      direction: UpdateDirectionSchema.default("forward"),
      isUpdate: z.boolean().default(false),
      maxWorkers: z.number().int().positive().default(5),
      notify: z.boolean().default(false),
      pageRange: PageRangeSchema.optional(),
      source: z.union([HtmlSourceOptionsSchema, WordPressSourceOptionsSchema]).optional(),
      useMultiThreading: z.boolean().default(false),
    }),
  }),
  paths: z.object({
    data: z.string(),
    root: z.string(),
  }),
  sources: z.object({
    html: z.array(HtmlSourceOptionsSchema).default([]),
    wordpress: z.array(WordPressSourceOptionsSchema).default([]),
  }),
});

// types
export type SourceKind = z.infer<typeof SourceKindSchema>;
export type SourceDate = z.infer<typeof SourceDateSchema>;
export type HtmlSourceOptions = z.infer<typeof HtmlSourceOptionsSchema>;
export type WordPressSourceOptions = z.infer<typeof WordPressSourceOptionsSchema>;
export type AnySourceOptions = HtmlSourceOptions | WordPressSourceOptions;

export type CrawlerConfiguration = z.infer<typeof CrawlerConfigurationSchema>;
export type CrawlerHttpOptions = CrawlerConfiguration["fetch"]["client"];
export type CrawlerFetchingOptions = CrawlerConfiguration["fetch"]["crawler"];
export type CrawlerAsyncOptions = CrawlerConfiguration["fetch"]["async"];
export type CrawlerBackendOptions = CrawlerConfiguration["backend"];
