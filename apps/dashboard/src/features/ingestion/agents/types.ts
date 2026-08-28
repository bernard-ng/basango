import type { RouterOutputs } from "@basango/api/trpc/routers/_app";

type IngestionAgentActivitiesPage = RouterOutputs["operations"]["listIngestionAgentActivities"];

export type IngestionAgentActivity = IngestionAgentActivitiesPage["items"][number];
export type IngestionAgentDetails = RouterOutputs["operations"]["getIngestionAgentDetails"];
