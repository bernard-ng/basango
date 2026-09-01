import z from "zod";

import { idSchema, paginationRequestSchema } from "../shared";

export const ArticleListSchema = paginationRequestSchema.extend({
  categoryId: idSchema.optional(),
  publishedAfter: z.coerce.date().optional(),
  publishedBefore: z.coerce.date().optional(),
  search: z.string().trim().max(512).optional(),
  sourceId: idSchema.optional(),
});

export const ArticleSchema = z.object({
  id: idSchema,
});

export type Article = z.infer<typeof ArticleSchema>;
export type ArticleList = z.infer<typeof ArticleListSchema>;
