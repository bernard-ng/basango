import type { RouterOutputs } from "@basango/api/trpc/routers/_app";
import type { IngestionRunState } from "@basango/domain/models";

type IngestionRunsPage = RouterOutputs["operations"]["listIngestionRuns"];
type IngestionRunActivitiesPage = RouterOutputs["operations"]["listIngestionRunActivities"];

export type IngestionRun = IngestionRunsPage["items"][number];
export type IngestionRunAction = Extract<IngestionRunState, "completed" | "failed"> | "delete";
export type IngestionRunActivity = IngestionRunActivitiesPage["items"][number];
export type IngestionRunDetails = RouterOutputs["operations"]["getIngestionRunDetails"];
