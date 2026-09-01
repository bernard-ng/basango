import z from "zod";

import { idSchema, paginationRequestSchema } from "../shared";

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

export type CommentList = z.infer<typeof commentListSchema>;
export type CreateComment = z.infer<typeof createCommentSchema>;
export type DeleteComment = z.infer<typeof deleteCommentSchema>;
