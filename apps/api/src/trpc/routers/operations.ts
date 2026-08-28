import {
  closeIngestionRuns,
  getIngestionAgents,
  getIngestionSummary,
  listIngestionRuns,
} from "@basango/db/queries";
import { closeIngestionRunsSchema, ingestionRunsQuerySchema } from "@basango/domain/models";

import { announceIngestionChange } from "#api/services/ingestion/signals";
import { getIngestionThroughputSnapshot } from "#api/services/ingestion/throughput";
import { adminProcedure, createTRPCRouter } from "#api/trpc/init";

export const operationsRouter = createTRPCRouter({
  closeIngestionRuns: adminProcedure
    .input(closeIngestionRunsSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await closeIngestionRuns(ctx.db, input);

      if (result.updatedCount > 0 || result.releasedAgentCount > 0) {
        announceIngestionChange(["agents", "runs", "summary"]);
      }

      return result;
    }),
  getIngestionAgents: adminProcedure.query(({ ctx }) => getIngestionAgents(ctx.db)),
  getIngestionSummary: adminProcedure.query(({ ctx }) => getIngestionSummary(ctx.db)),
  getIngestionThroughput: adminProcedure.query(({ ctx }) => getIngestionThroughputSnapshot(ctx.db)),
  listIngestionRuns: adminProcedure
    .input(ingestionRunsQuerySchema)
    .query(({ ctx, input }) => listIngestionRuns(ctx.db, input)),
});
