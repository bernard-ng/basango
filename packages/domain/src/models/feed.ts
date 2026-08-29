import z from "zod";

import { idSchema, paginationRequestSchema } from "./shared";

const bookmarkNameSchema = z.string().trim().min(1).max(255);
const bookmarkDescriptionSchema = z.string().trim().max(512).optional();

export const readerArticleListSchema = paginationRequestSchema.extend({
  categoryId: idSchema.optional(),
  search: z.string().trim().max(512).optional(),
  sourceId: idSchema.optional(),
});

export const readerArticleSchema = z.object({
  id: idSchema,
});

export const readerSourceListSchema = paginationRequestSchema.extend({
  followedOnly: z.boolean().optional(),
  search: z.string().trim().max(255).optional(),
});

export const readerSourceSchema = z.object({
  id: idSchema,
});

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

export const commentListSchema = paginationRequestSchema.extend({
  articleId: idSchema,
});

export const createCommentSchema = z.object({
  articleId: idSchema,
  content: z.string().trim().min(1).max(512),
});

export const deleteCommentSchema = z.object({
  id: idSchema,
});

export type Bookmark = z.infer<typeof bookmarkSchema>;
export type BookmarkArticle = z.infer<typeof bookmarkArticleSchema>;
export type BookmarkArticleList = z.infer<typeof bookmarkArticleListSchema>;
export type BookmarkId = z.infer<typeof bookmarkIdSchema>;
export type BookmarkList = z.infer<typeof bookmarkListSchema>;
export type CommentList = z.infer<typeof commentListSchema>;
export type CreateBookmark = z.infer<typeof createBookmarkSchema>;
export type CreateComment = z.infer<typeof createCommentSchema>;
export type DeleteComment = z.infer<typeof deleteCommentSchema>;
export type ReaderArticle = z.infer<typeof readerArticleSchema>;
export type ReaderArticleList = z.infer<typeof readerArticleListSchema>;
export type ReaderSource = z.infer<typeof readerSourceSchema>;
export type ReaderSourceList = z.infer<typeof readerSourceListSchema>;
export type UpdateBookmark = z.infer<typeof updateBookmarkSchema>;
