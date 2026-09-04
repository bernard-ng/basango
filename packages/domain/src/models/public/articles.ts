import z from "zod";

import { searchArticlesSchema } from "../articles";
import { idSchema, paginationRequestSchema } from "../shared";

export const ArticleListSchema = paginationRequestSchema.extend({
  categoryId: idSchema.optional(),
  publishedAfter: z.coerce.date().optional(),
  publishedBefore: z.coerce.date().optional(),
  sourceId: idSchema.optional(),
});

export const ArticleSearchSchema = searchArticlesSchema;

export const ArticleSchema = z.object({
  id: idSchema,
});

export type Article = z.infer<typeof ArticleSchema>;
export type ArticleList = z.infer<typeof ArticleListSchema>;
export type ArticleSearch = z.infer<typeof ArticleSearchSchema>;
