import { z } from "@hono/zod-openapi";

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
    link: z.url().openapi({
      description: "The URL of the article.",
      example: "https://example.com/article",
    }),
    metadata: metadataSchema.optional(),
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
