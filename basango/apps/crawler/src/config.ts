import path from "node:path";

import { loadConfig } from "@devscast/config";
import { z } from "zod";
import {
  DateRangeSchema,
  HtmlSourceConfigSchema,
  PageRangeSchema,
  UpdateDirectionSchema,
  WordPressSourceConfigSchema,
} from "@/schema";

export const PROJECT_DIR = path.resolve(__dirname, "../");

export const PipelineConfigSchema = z.object({
  paths: z.object({
    root: z.string().default(PROJECT_DIR),
    data: z.string().default(path.join(PROJECT_DIR, "data", "dataset")),
    config: z.string().default(path.join(PROJECT_DIR, "config")),
  }),
  fetch: z.object({
    client: z.object({
      timeout: z.number().positive().default(20),
      userAgent: z.string().default("Basango/0.1 (+https://github.com/bernard-ng/basango)"),
      followRedirects: z.boolean().default(true),
      verifySsl: z.boolean().default(true),
      rotate: z.boolean().default(true),
      maxRetries: z.number().int().nonnegative().default(3),
      backoffInitial: z.number().nonnegative().default(1),
      backoffMultiplier: z.number().positive().default(2),
      backoffMax: z.number().nonnegative().default(30),
      respectRetryAfter: z.boolean().default(true),
    }),
    crawler: z.object({
      source: z.union([HtmlSourceConfigSchema, WordPressSourceConfigSchema]).optional(),
      pageRange: PageRangeSchema.optional(),
      dateRange: DateRangeSchema.optional(),
      category: z.string().optional(),
      notify: z.boolean().default(false),
      isUpdate: z.boolean().default(false),
      useMultiThreading: z.boolean().default(false),
      maxWorkers: z.number().int().positive().default(5),
      direction: UpdateDirectionSchema.default("forward"),
    }),
    async: z.object({
      redisUrl: z.string().default("redis://localhost:6379/0"),
      prefix: z.string().default("basango:crawler:queue"),
      ttl: z.object({
        default: z.number().int().positive().default(600),
        result: z.number().int().nonnegative().default(3600),
        failure: z.number().int().nonnegative().default(3600),
      }),
      queues: z.object({
        listing: z.string().default("listing"),
        details: z.string().default("details"),
        processing: z.string().default("processing"),
      }),
    }),
  }),
  sources: z.object({
    html: z.array(HtmlSourceConfigSchema).default([]),
    wordpress: z.array(WordPressSourceConfigSchema).default([]),
  }),
});

export const { config, env } = loadConfig({
  schema: PipelineConfigSchema,
  cwd: process.cwd(),
  env: {
    path: path.join(PROJECT_DIR, ".env"),
  },
  sources: [
    path.join(PROJECT_DIR, "config", "pipeline.json"),
    path.join(PROJECT_DIR, "config", "sources.json"),
  ],
});

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
export type FetchClientConfig = PipelineConfig["fetch"]["client"];
export type FetchCrawlerConfig = PipelineConfig["fetch"]["crawler"];
export type FetchAsyncConfig = PipelineConfig["fetch"]["async"];
