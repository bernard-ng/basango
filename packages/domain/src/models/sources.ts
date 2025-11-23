import z from "zod";

import { credibilitySchema, idSchema, limitSchema, publicationsSchema } from "./shared";

// schemas
export const sourceSchema = z.object({
  articles: z.number().int().min(0).optional(),
  credibility: credibilitySchema.optional(),
  description: z.string().max(1024).optional(),
  displayName: z.string().min(1).max(255).optional(),
  id: idSchema,
  name: z.string().min(1).max(255),
  publications: publicationsSchema.optional(),
  url: z.url().max(255),
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
