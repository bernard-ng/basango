import { z } from "@hono/zod-openapi";

const sentimentSchema = z.enum(["positive", "neutral", "negative"]).openapi({
  default: "neutral",
  description: "The sentiment of the article content.",
});

const readingTimeSchema = z.number().min(1).openapi({
  description: "The estimated reading time of the article in minutes.",
  example: 5,
});

const tokenStatisticsSchema = z.object({
  body: z.number().min(0).openapi({
    description: "The number of tokens in the article body.",
    example: 350,
  }),
  categories: z.number().min(0).openapi({
    description: "The number of tokens in the article categories.",
    example: 25,
  }),
  excerpt: z.number().min(0).openapi({
    description: "The number of tokens in the article excerpt.",
    example: 50,
  }),
  title: z.number().min(0).openapi({
    description: "The number of tokens in the article title.",
    example: 15,
  }),
  total: z.number().min(0).openapi({
    description: "The total number of tokens in the article.",
    example: 440,
  }),
});

const metadataSchema = z.object({
  description: z.string().optional().openapi({
    description: "A brief description or summary of the article.",
    example: "This article discusses the latest advancements in AI technology.",
  }),
  image: z.url().optional().openapi({
    description: "The URL of the main image associated with the article.",
    example: "https://example.com/image.jpg",
  }),
  title: z.string().optional().openapi({
    description: "The title of the article for metadata purposes.",
    example: "The Rise of AI",
  }),
});

export const createArticleSchema = z
  .object({
    body: z.string().min(1).openapi({
      description: "The main content of the article.",
      example: "This is the body of the article...",
    }),
    categories: z.array(z.string()).openapi({
      description: "The categories or tags associated with the article.",
      example: ["Technology", "AI"],
    }),
    hash: z.string().min(1).openapi({
      description: "The unique hash of the article link.",
      example: "d41d8cd98f00b204e9800998ecf8427e",
    }),
    link: z.url().openapi({
      description: "The URL of the article.",
      example: "https://example.com/article",
    }),
    metadata: metadataSchema.optional(),
    publishedAt: z.date().openapi({
      description: "The publication date of the article.",
      example: "2023-01-01T00:00:00Z",
    }),
    readingTime: readingTimeSchema.optional(),
    sentiment: sentimentSchema.optional().optional().default("neutral"),
    sourceId: z.string().openapi({
      description: "The unique identifier of the source from which the article was crawled.",
      example: "source-123",
    }),
    title: z.string().min(1).openapi({
      description: "The title of the article.",
      example: "The Rise of AI",
    }),
    tokenStatistics: tokenStatisticsSchema.optional(),
  })
  .openapi("CreateArticle");

export const createArticleResponseSchema = z
  .object({
    id: z.uuid().openapi({
      description: "The unique identifier of the article.",
      example: "b3b7c8e2-1f2a-4c3d-9e4f-5a6b7c8d9e0f",
    }),
    sourceId: z.uuid().openapi({
      description: "The unique identifier of the source associated with the article.",
      example: "a1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6",
    }),
  })
  .openapi("CreateArticleResponse");
