import {
  closeIngestionRuns,
  deleteIngestionRuns,
  getIngestionAgentDetails,
  getIngestionAgents,
  getIngestionRunDetails,
  getIngestionSummary,
  listIngestionAgentActivities,
  listIngestionRunActivities,
  listIngestionRuns,
  resetIngestionLifecycle,
} from "@basango/db/queries";
import {
  closeIngestionRunsSchema,
  deleteIngestionRunsSchema,
  ingestionAgentActivitiesQuerySchema,
  ingestionAgentParamsSchema,
  ingestionRunActivitiesQuerySchema,
  ingestionRunParamsSchema,
  ingestionRunsQuerySchema,
} from "@basango/domain/models";

import { announceIngestionChange } from "#api/services/ingestion/signals";
import {
  getIngestionThroughputSnapshot,
  invalidateIngestionThroughput,
} from "#api/services/ingestion/throughput";
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
  deleteIngestionRuns: adminProcedure
    .input(deleteIngestionRunsSchema)
    .mutation(async ({ ctx, input }) => {
      const result = await deleteIngestionRuns(ctx.db, input);

      if (result.deletedCount > 0) {
        invalidateIngestionThroughput();
        announceIngestionChange(["agents", "runs", "summary", "throughput"]);
      }

      return result;
    }),
  getIngestionAgentDetails: adminProcedure
    .input(ingestionAgentParamsSchema)
    .query(({ ctx, input }) => getIngestionAgentDetails(ctx.db, input.agentId)),
  getIngestionAgents: adminProcedure.query(({ ctx }) => getIngestionAgents(ctx.db)),
  getIngestionRunDetails: adminProcedure
    .input(ingestionRunParamsSchema)
    .query(({ ctx, input }) => getIngestionRunDetails(ctx.db, input.runId)),
  getIngestionSummary: adminProcedure.query(({ ctx }) => getIngestionSummary(ctx.db)),
  getIngestionThroughput: adminProcedure.query(({ ctx }) => getIngestionThroughputSnapshot(ctx.db)),
  listIngestionAgentActivities: adminProcedure
    .input(ingestionAgentActivitiesQuerySchema)
    .query(({ ctx, input }) => listIngestionAgentActivities(ctx.db, input)),
  listIngestionRunActivities: adminProcedure
    .input(ingestionRunActivitiesQuerySchema)
    .query(({ ctx, input }) => listIngestionRunActivities(ctx.db, input)),
  listIngestionRuns: adminProcedure
    .input(ingestionRunsQuerySchema)
    .query(({ ctx, input }) => listIngestionRuns(ctx.db, input)),
  resetIngestionLifecycle: adminProcedure.mutation(async ({ ctx }) => {
    const result = await resetIngestionLifecycle(ctx.db);

    invalidateIngestionThroughput();
    announceIngestionChange(["agents", "runs", "summary", "throughput"]);

    return result;
  }),
});
