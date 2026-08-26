import { getIngestionAgents, getIngestionSummary, listIngestionRuns } from "@basango/db/queries";
import { ingestionRunsQuerySchema } from "@basango/domain/models";

import { getIngestionThroughputSnapshot } from "#api/services/ingestion/throughput";
import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const operationsRouter = createTRPCRouter({
  getIngestionAgents: adminProcedure.query(({ ctx }) => getIngestionAgents(ctx.db)),
  getIngestionSummary: adminProcedure.query(({ ctx }) => getIngestionSummary(ctx.db)),
  getIngestionThroughput: adminProcedure.query(({ ctx }) => getIngestionThroughputSnapshot(ctx.db)),
  listIngestionRuns: adminProcedure
    .input(ingestionRunsQuerySchema)
    .query(({ ctx, input }) => listIngestionRuns(ctx.db, input)),
});
