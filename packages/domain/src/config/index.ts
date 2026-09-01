import { fileURLToPath } from "node:url";

import { defineConfig, jsonFile } from "@ngandu-dev/config";
import z from "zod";

import { ApiConfigurationSchema } from "./api";
import { DatabaseConfigurationSchema } from "./database";
import { resolveEnvFiles } from "./environment";
import { LoggerConfigurationSchema } from "./logger";
import { SharedConfigurationSchema } from "./shared";

export * from "./api";
export * from "./database";
export * from "./logger";
export * from "./shared";

const nodeEnvironmentSchema = z.enum(["development", "test", "production"]).default("development");

export const { env, config } = await defineConfig({
  cwd: fileURLToPath(new URL("../..", import.meta.url)),
  environment: {
    files: resolveEnvFiles(),
    redact: [
      "BASANGO_API_CRAWLER_TOKEN",
      "BASANGO_API_KEY",
      "BASANGO_DATABASE_URL",
      "BASANGO_MCP_TOKEN",
      "BASANGO_RESEND_API_KEY",
      "BETTER_AUTH_SECRET",
    ],
    schema: z.object({
      BASANGO_API_ALLOWED_ORIGINS: z.string().optional(),
      BASANGO_API_CRAWLER_ENDPOINT: z.string().optional(),
      BASANGO_API_CRAWLER_TOKEN: z.string().min(1),
      BASANGO_API_HOST: z.string().default("localhost"),
      BASANGO_API_KEY: z.string().optional(),
      BASANGO_API_PORT: z.coerce.number().int().min(1).max(65535).default(3080),
      BASANGO_CRAWLER_AGENT_ID: z.string().optional(),
      BASANGO_CRAWLER_CONFIG_PATH: z.string().optional(),
      BASANGO_CRAWLER_DATA_PATH: z.string().optional(),
      BASANGO_CRAWLER_FETCH_MAX_RETRIES: z.string().optional(),
      BASANGO_CRAWLER_FETCH_RESPECT_RETRY_AFTER: z.string().optional(),
      BASANGO_CRAWLER_FETCH_USER_AGENT: z.string().optional(),
      BASANGO_CRAWLER_NODE_ID: z.string().optional(),
      BASANGO_CRAWLER_QUEUE_ARTICLES: z.string().optional(),
      BASANGO_CRAWLER_QUEUE_DISCOVERY: z.string().optional(),
      BASANGO_CRAWLER_REDIS_URL: z.string().optional(),
      BASANGO_CRAWLER_RETAIN_COMPLETED: z.string().optional(),
      BASANGO_CRAWLER_RETAIN_FAILED: z.string().optional(),
      BASANGO_CRAWLER_SOURCE_IDS: z.string().optional(),
      BASANGO_CRAWLER_SQLITE_PATH: z.string().optional(),
      BASANGO_CRAWLER_UPDATE_DIRECTION: z.string().optional(),
      BASANGO_DATABASE_URL: z.string().min(1),
      BASANGO_ENV_PATH: z.string().optional(),
      BASANGO_LOGGER_LEVEL: z.string().default("info"),
      BASANGO_LOGGER_PRETTY: z.string().optional(),
      BASANGO_MCP_TOKEN: z.string().min(32),
      BASANGO_RESEND_API_KEY: z.string().optional(),
      BASANGO_RESEND_FROM_EMAIL: z.string().optional(),
      BETTER_AUTH_COOKIE_DOMAIN: z.string().optional(),
      BETTER_AUTH_SECRET: z.string().optional(),
      BETTER_AUTH_URL: z.string().optional(),
      NODE_ENV: nodeEnvironmentSchema,
    }),
  },
  schema: z.object({
    api: ApiConfigurationSchema,
    database: DatabaseConfigurationSchema,
    logger: LoggerConfigurationSchema,
    shared: SharedConfigurationSchema,
  }),
  sources: [
    jsonFile("config/api.json", { name: "api" }),
    jsonFile("config/database.json", { name: "database" }),
    jsonFile("config/logger.json", { name: "logger" }),
    jsonFile("config/shared.json", { name: "shared" }),
  ],
});
