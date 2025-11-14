import { createArticle } from "@basango/db/queries";

import { createArticleSchema } from "#api/schemas/articles";
import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const articlesRouter = createTRPCRouter({
  create: protectedProcedure.input(createArticleSchema).mutation(async ({ ctx, input }) => {
    return createArticle(ctx.db, input);
  }),
});
