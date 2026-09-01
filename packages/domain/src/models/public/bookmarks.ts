import z from "zod";

import { idSchema, paginationRequestSchema } from "../shared";

const bookmarkNameSchema = z.string().trim().min(1).max(255);
const bookmarkDescriptionSchema = z.string().trim().max(512).optional();

export const bookmarkListSchema = paginationRequestSchema;

export const bookmarkSchema = z.object({
  articlesCount: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
  description: z.string().nullable(),
  id: idSchema,
  isPublic: z.boolean(),
  name: z.string(),
  updatedAt: z.coerce.date().nullable(),
});

export const createBookmarkSchema = z.object({
  description: bookmarkDescriptionSchema,
  isPublic: z.boolean().default(false),
  name: bookmarkNameSchema,
});

export const updateBookmarkSchema = createBookmarkSchema.extend({
  id: idSchema,
});

export const bookmarkIdSchema = z.object({
  id: idSchema,
});

export const bookmarkArticleSchema = z.object({
  articleId: idSchema,
  bookmarkId: idSchema,
});

export const bookmarkArticleListSchema = paginationRequestSchema.extend({
  bookmarkId: idSchema,
});

export type Bookmark = z.infer<typeof bookmarkSchema>;
export type BookmarkArticle = z.infer<typeof bookmarkArticleSchema>;
export type BookmarkArticleList = z.infer<typeof bookmarkArticleListSchema>;
export type BookmarkId = z.infer<typeof bookmarkIdSchema>;
export type BookmarkList = z.infer<typeof bookmarkListSchema>;
export type CreateBookmark = z.infer<typeof createBookmarkSchema>;
export type UpdateBookmark = z.infer<typeof updateBookmarkSchema>;
