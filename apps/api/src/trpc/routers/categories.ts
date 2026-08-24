import { getCategories } from "@basango/db/queries";

import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const categoriesRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => getCategories(ctx.db)),
});
