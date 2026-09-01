import { createComment, deleteComment, getComments } from "@basango/db/queries/public";
import {
  commentListSchema,
  createCommentSchema,
  deleteCommentSchema,
} from "@basango/domain/models/public";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const commentsRouter = createTRPCRouter({
  create: protectedProcedure.input(createCommentSchema).mutation(async ({ ctx, input }) => {
    return createComment(ctx.db, ctx.session.user.id, input);
  }),

  delete: protectedProcedure.input(deleteCommentSchema).mutation(async ({ ctx, input }) => {
    return deleteComment(ctx.db, ctx.session.user.id, input.id);
  }),

  list: protectedProcedure.input(commentListSchema).query(async ({ ctx, input }) => {
    return getComments(ctx.db, input);
  }),
});
