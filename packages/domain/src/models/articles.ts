import { z } from "@hono/zod-openapi";

import { idSchema, sentimentSchema } from "#domain/models/shared";

// schemas
export const articleMetadataSchema = z.object({
  author: z.string().optional().openapi({
    description: "The author of the article.",
    example: "John Doe",
  }),
  description: z.string().optional().openapi({
    description: "A brief description or summary of the article.",
    example: "This article discusses the latest advancements in AI technology.",
  }),
  image: z.url().optional().openapi({
    description: "The URL of the main image associated with the article.",
    example: "https://example.com/image.jpg",
  }),
  publishedAt: z.date().optional().openapi({
    description: "The publication date of the article as a Date object.",
    example: "2023-01-01T00:00:00Z",
  }),
  title: z.string().optional().openapi({
    description: "The title of the article for metadata purposes.",
    example: "The Rise of AI",
  }),
  updatedAt: z.date().optional().openapi({
    description: "The last updated date of the article as a Date object.",
    example: "2023-01-02T12:00:00Z",
  }),
  url: z.url().optional().openapi({
    description: "The canonical URL of the article.",
    example: "https://example.com/article",
  }),
});

export const tokenStatisticsSchema = z.object({
  body: z.number().optional().default(0).openapi({
    description: "The number of tokens in the article body.",
    example: 250,
  }),
  categories: z.number().optional().default(0).openapi({
    description: "The number of tokens in the article categories.",
    example: 3,
  }),
  excerpt: z.number().optional().default(0).openapi({
    description: "The number of tokens in the article excerpt.",
    example: 50,
  }),
  title: z.number().optional().default(0).openapi({
    description: "The number of tokens in the article title.",
    example: 10,
  }),
  total: z.number().optional().default(0).openapi({
    description: "The total number of tokens in the article.",
    example: 313,
  }),
});

export const articleSchema = z.object({
  body: z.string().min(1).openapi({
    description: "The main content of the article.",
    example: "This is the body of the article...",
  }),
  categories: z.array(z.string()).openapi({
    description: "The categories or tags associated with the article.",
    example: ["Technology", "AI"],
  }),
  createdAt: z.date().openapi({
    description: "The date and time when the article was created in the system.",
    example: "2023-01-01T12:00:00Z",
  }),
  hash: z.string().min(1).openapi({
    description: "The unique hash of the article link.",
    example: "d41d8cd98f00b204e9800998ecf8427e",
  }),
  id: idSchema,
  link: z.string().url().openapi({
    description: "The URL of the article.",
    example: "https://example.com/article",
  }),
  metadata: articleMetadataSchema.optional(),
  publishedAt: z.date().openapi({
    description: "The publication date of the article as a Date object.",
    example: "2023-01-01T00:00:00Z",
  }),
  sourceId: z.union([z.uuid(), z.string().min(1)]).openapi({
    description: "The unique identifier of the source from which the article was crawled.",
    example: "b3e1c8f4-5d6a-4c9e-8f1e-2d3c4b5a6f7g",
  }),
  title: z.string().min(1).openapi({
    description: "The title of the article.",
    example: "The Rise of AI",
  }),
  tokenStatistics: tokenStatisticsSchema.optional(),
  updatedAt: z.date().optional().openapi({
    description: "The date and time when the article was last updated in the system.",
    example: "2023-01-02T12:00:00Z",
  }),
});

// API
export const createArticleSchema = z
  .object({
    body: z.string().min(1).openapi({
      description: "The main content of the article.",
      example: "This is the body of the article...",
    }),
    categories: z
      .array(z.string())
      .openapi({
        description: "The categories or tags associated with the article.",
        example: ["Technology", "AI"],
      })
      .optional()
      .default([]),
    hash: z.string().min(1).openapi({
      description: "The unique hash of the article link.",
      example: "d41d8cd98f00b204e9800998ecf8427e",
    }),
    link: z.string().url().openapi({
      description: "The URL of the article.",
      example: "https://example.com/article",
    }),
    metadata: articleMetadataSchema.optional(),
    publishedAt: z
      .string()
      .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Invalid date format",
      })
      .transform((value) => new Date(value))
      .openapi({
        description: "The publication date of the article in ISO 8601 format.",
        example: "2023-01-01T00:00:00Z",
      }),
    sourceId: z.string().openapi({
      description: "The unique identifier of the source from which the article was crawled.",
      example: "radiookapi.net",
    }),
    title: z.string().min(1).openapi({
      description: "The title of the article.",
      example: "The Rise of AI",
    }),
  })
  .openapi("CreateArticle");

export const createArticleResponseSchema = z
  .object({ id: idSchema, sourceId: idSchema })
  .openapi("CreateArticleResponse");

export const getArticlesSchema = z.object({
  category: z.string().min(1).max(255).optional().openapi({
    description: "Filter articles by a specific category.",
    example: "Technology",
  }),
  cursor: z.string().nullable().optional().openapi({
    description: "Optional cursor for fetching the next page of articles.",
  }),
  limit: z.number().int().min(1).max(100).optional().openapi({
    default: 10,
    description: "Maximum number of articles to return per page.",
    example: 20,
  }),
  search: z.string().max(512).optional().openapi({
    description: "Full-text search query applied to article titles and bodies.",
    example: "gouvernement congolais",
  }),
  sentiment: sentimentSchema.optional(),
  sourceId: idSchema.optional(),
});

// types
export type Article = z.infer<typeof articleSchema>;
export type ArticleMetadata = z.infer<typeof articleMetadataSchema>;
export type TokenStatistics = z.infer<typeof tokenStatisticsSchema>;
