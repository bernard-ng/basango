import { z } from "@hono/zod-openapi";

import {
  credibilitySchema,
  idSchema,
  limitSchema,
  publicationsSchema,
} from "#domain/models/shared";

// schemas
export const sourceSchema = z.object({
  articles: z.number().int().min(0).optional().openapi({
    description: "The total number of articles from this source.",
    example: 1250,
  }),
  credibility: credibilitySchema.optional(),
  description: z.string().max(1024).optional().openapi({
    description: "A brief description of the source.",
    example: "Radio Okapi is a Congolese radio station that provides news and information.",
  }),
  displayName: z.string().min(1).max(255).optional().openapi({
    description: "The display name of the source.",
    example: "Radio Okapi",
  }),
  id: idSchema,
  name: z.string().min(1).max(255).openapi({
    description: "The name of the source.",
    example: "radiookapi.com",
  }),
  publications: publicationsSchema.optional(),
  url: z.url().max(255).openapi({
    description: "The URL of the source.",
    example: "https://techcrunch.com",
  }),
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

// types
export type Source = z.infer<typeof sourceSchema>;
