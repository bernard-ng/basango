import type { RouterOutputs } from "@basango/api/trpc/routers/_app";

type IngestionRunsPage = RouterOutputs["operations"]["listIngestionRuns"];

export type IngestionRun = IngestionRunsPage["items"][number];
