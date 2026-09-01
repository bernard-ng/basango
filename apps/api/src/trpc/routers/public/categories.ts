import { getCategories } from "@basango/db/queries/public";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const categoriesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    return getCategories(ctx.db);
  }),
});
