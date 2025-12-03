import { getCategories } from "@basango/db/queries";

import { createTRPCRouter, protectedProcedure } from "#api/trpc/init";

export const categoriesRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => getCategories(ctx.db)),
});
