import {
  followSource,
  getSourceById,
  getSources,
  unfollowSource,
} from "@basango/db/queries/public";
import { SourceListSchema, SourceSchema } from "@basango/domain/models/public";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const sourcesRouter = createTRPCRouter({
  follow: protectedProcedure.input(SourceSchema).mutation(async ({ ctx, input }) => {
    return followSource(ctx.db, ctx.session.user.id, input.id);
  }),

  get: protectedProcedure.input(SourceSchema).query(async ({ ctx, input }) => {
    return getSourceById(ctx.db, ctx.session.user.id, input.id);
  }),

  list: protectedProcedure.input(SourceListSchema).query(async ({ ctx, input }) => {
    return getSources(ctx.db, ctx.session.user.id, input);
  }),

  unfollow: protectedProcedure.input(SourceSchema).mutation(async ({ ctx, input }) => {
    return unfollowSource(ctx.db, ctx.session.user.id, input.id);
  }),
});
