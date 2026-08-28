import z from "zod";

export const INGESTION_RUN_STATES = ["preparing", "running", "completed", "failed"] as const;

export const INGESTION_RUN_TERMINAL_STATES = ["completed", "failed"] as const;

export const INGESTION_CHANGE_TOPICS = ["agents", "runs", "summary", "throughput"] as const;

export const INGESTION_RUN_SORT_FIELDS = [
  "agentId",
  "articlesDelivered",
  "articlesDiscovered",
  "articlesFailed",
  "articlesPersisted",
  "articlesProcessed",
  "articlesSkipped",
  "durationMs",
  "lastSignalAt",
  "sourceId",
  "state",
] as const;

export const ingestionRunStateSchema = z.enum(INGESTION_RUN_STATES);

export const closeIngestionRunsSchema = z.object({
  runIds: z
    .array(z.uuid())
    .min(1)
    .max(100)
    .refine((runIds) => new Set(runIds).size === runIds.length, "Run IDs must be unique."),
  state: z.enum(INGESTION_RUN_TERMINAL_STATES),
});

export const ingestionRunsQuerySchema = z.object({
  filters: z
    .object({
      query: z.string().trim().min(1).max(255).optional(),
      sourceId: z.string().trim().min(1).max(255).optional(),
      states: z.array(ingestionRunStateSchema).max(INGESTION_RUN_STATES.length).optional(),
    })
    .optional(),
  page: z
    .object({
      current: z.number().int().positive().default(1),
      limit: z.number().int().min(10).max(50).default(10),
    })
    .optional(),
  sort: z
    .object({
      direction: z.enum(["asc", "desc"]),
      field: z.enum(INGESTION_RUN_SORT_FIELDS),
    })
    .optional(),
});

export const ingestionRunMetricsSchema = z.object({
  articlesDelivered: z.number().int().nonnegative(),
  articlesDiscovered: z.number().int().nonnegative(),
  articlesFailed: z.number().int().nonnegative(),
  articlesPersisted: z.number().int().nonnegative(),
  articlesProcessed: z.number().int().nonnegative().optional(),
  articlesSkipped: z.number().int().nonnegative().optional(),
});

const signalEnvelopeSchema = z.object({
  agentId: z.string().min(1).max(255),
  emittedAt: z.coerce.date(),
  signalId: z.uuid(),
  version: z.string().min(1).max(64).optional(),
});

const runSignalSchema = signalEnvelopeSchema.extend({
  runId: z.uuid(),
  sourceId: z.string().min(1).max(255),
});

export const ingestionSignalSchema = z.discriminatedUnion("type", [
  signalEnvelopeSchema.extend({
    type: z.literal("agent.heartbeat"),
  }),
  signalEnvelopeSchema.extend({
    type: z.literal("agent.reset"),
  }),
  runSignalSchema.extend({
    type: z.literal("run.preparing"),
  }),
  runSignalSchema.extend({
    type: z.literal("run.started"),
  }),
  runSignalSchema.extend({
    metrics: ingestionRunMetricsSchema,
    type: z.literal("run.progress"),
  }),
  runSignalSchema.extend({
    durationMs: z.number().int().nonnegative(),
    metrics: ingestionRunMetricsSchema,
    type: z.literal("run.completed"),
  }),
  runSignalSchema.extend({
    durationMs: z.number().int().nonnegative(),
    error: z.string().min(1).max(4096),
    metrics: ingestionRunMetricsSchema,
    type: z.literal("run.failed"),
  }),
]);

export const ingestionSignalAcceptedSchema = z.object({
  accepted: z.literal(true),
  duplicate: z.boolean(),
});

export const ingestionChangeSchema = z.object({
  latestSignalId: z.uuid(),
  topics: z.array(z.enum(INGESTION_CHANGE_TOPICS)).min(1),
});

export type IngestionChange = z.infer<typeof ingestionChangeSchema>;
export type IngestionChangeTopic = (typeof INGESTION_CHANGE_TOPICS)[number];
export type CloseIngestionRuns = z.infer<typeof closeIngestionRunsSchema>;
export type IngestionRunMetrics = z.infer<typeof ingestionRunMetricsSchema>;
export type IngestionRunsQuery = z.infer<typeof ingestionRunsQuerySchema>;
export type IngestionRunState = z.infer<typeof ingestionRunStateSchema>;
export type IngestionSignal = z.infer<typeof ingestionSignalSchema>;
export type IngestionSignalType = IngestionSignal["type"];
