import path from "node:path";

import {
  HtmlSourceConfigSchema,
  PageRangeSchema,
  TimestampRangeSchema,
  UpdateDirectionSchema,
  WordPressSourceConfigSchema,
} from "@basango/domain/crawler";
import { loadConfig as defineConfig } from "@devscast/config";
import { z } from "zod";

export const PROJECT_DIR = path.resolve(__dirname, "../");

export const PipelineConfigSchema = z.object({
  fetch: z.object({
    async: z.object({
      prefix: z.string().default("basango:crawler:queue"),
      queues: z.object({
        details: z.string().default("details"),
        listing: z.string().default("listing"),
        processing: z.string().default("processing"),
      }),
      redisUrl: z.string().default("redis://localhost:6379/0"),
      ttl: z.object({
        default: z.number().int().positive().default(600),
        failure: z.number().int().nonnegative().default(3600),
        result: z.number().int().nonnegative().default(3600),
      }),
    }),
    client: z.object({
      backoffInitial: z.number().nonnegative().default(1),
      backoffMax: z.number().nonnegative().default(30),
      backoffMultiplier: z.number().positive().default(2),
      followRedirects: z.boolean().default(true),
      maxRetries: z.number().int().nonnegative().default(3),
      respectRetryAfter: z.boolean().default(true),
      rotate: z.boolean().default(true),
      timeout: z.number().positive().default(20),
      userAgent: z.string().default("Basango/0.1 (+https://github.com/bernard-ng/basango)"),
      verifySsl: z.boolean().default(true),
    }),
    crawler: z.object({
      category: z.string().optional(),
      dateRange: TimestampRangeSchema.optional(),
      direction: UpdateDirectionSchema.default("forward"),
      isUpdate: z.boolean().default(false),
      maxWorkers: z.number().int().positive().default(5),
      notify: z.boolean().default(false),
      pageRange: PageRangeSchema.optional(),
      source: z.union([HtmlSourceConfigSchema, WordPressSourceConfigSchema]).optional(),
      useMultiThreading: z.boolean().default(false),
    }),
  }),
  paths: z.object({
    config: z.string().default(path.join(PROJECT_DIR, "config")),
    data: z.string().default(path.join(PROJECT_DIR, "data", "datasets")),
    root: z.string().default(PROJECT_DIR),
  }),
  sources: z.object({
    html: z.array(HtmlSourceConfigSchema).default([]),
    wordpress: z.array(WordPressSourceConfigSchema).default([]),
  }),
});

export const { config, env } = defineConfig({
  cwd: process.cwd(),
  env: {
    path: path.join(PROJECT_DIR, ".env"),
  },
  schema: PipelineConfigSchema,
  sources: [
    path.join(PROJECT_DIR, "config", "pipeline.json"),
    path.join(PROJECT_DIR, "config", "sources.json"),
  ],
});

export type PipelineConfig = z.infer<typeof PipelineConfigSchema>;
export type FetchClientConfig = PipelineConfig["fetch"]["client"];
export type FetchCrawlerConfig = PipelineConfig["fetch"]["crawler"];
export type FetchAsyncConfig = PipelineConfig["fetch"]["async"];
