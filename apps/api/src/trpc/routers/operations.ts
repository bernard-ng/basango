import { getIngestionOverview, listIngestionRuns } from "@basango/db/queries";
import { ingestionRunsQuerySchema } from "@basango/domain/models";

import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const operationsRouter = createTRPCRouter({
  getIngestionOverview: adminProcedure.query(({ ctx }) => getIngestionOverview(ctx.db)),
  listIngestionRuns: adminProcedure
    .input(ingestionRunsQuerySchema)
    .query(({ ctx, input }) => listIngestionRuns(ctx.db, input)),
});
