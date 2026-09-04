import z from "zod";

export const SearchConfigurationSchema = z.object({
  apiKey: z.string().min(16),
  batchMaxBytes: z.number().int().min(1_000).default(8_000_000),
  batchSize: z.number().int().min(1).max(10_000).default(500),
  indexName: z.string().min(1).default("articles"),
  taskTimeoutMs: z.number().int().min(100).default(120_000),
  url: z.url(),
});

export type SearchConfiguration = z.infer<typeof SearchConfigurationSchema>;
