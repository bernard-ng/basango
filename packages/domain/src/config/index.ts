import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "@devscast/config";
import z from "zod";

import apiConfig from "../../config/api.json";
import crawlerConfig from "../../config/crawler.json";
import databaseConfig from "../../config/database.json";
import encryptionConfig from "../../config/encryption.json";
import loggerConfig from "../../config/logger.json";
import sharedConfig from "../../config/shared.json";
import { ApiConfigurationSchema } from "./api";
import { CrawlerConfigurationSchema } from "./crawler";
import { DatabaseConfigurationSchema } from "./database";
import { EncryptionConfigurationSchema } from "./encryption";
import { LoggerConfigurationSchema } from "./logger";
import { SharedConfigurationSchema } from "./shared";

export * from "./api";
export * from "./crawler";
export * from "./database";
export * from "./encryption";
export * from "./logger";
export * from "./shared";

const findEnvPath = (): string => {
  const configured = process.env.BASANGO_ENV_PATH?.trim();
  if (configured) {
    return path.resolve(configured);
  }

  let current = process.cwd();
  while (true) {
    const candidate = path.join(current, ".env");
    if (fs.existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.join(process.cwd(), ".env");
    }
    current = parent;
  }
};

export const { env, config } = defineConfig({
  env: {
    knownKeys: [
      "NODE_ENV",
      "BASANGO_API_HOST",
      "BASANGO_API_PORT",
      "BASANGO_API_ALLOWED_ORIGINS",
      "BASANGO_API_KEY",
      "BASANGO_API_CRAWLER_ENDPOINT",
      "BASANGO_API_CRAWLER_TOKEN",
      "BASANGO_API_JWT_SECRET",
      "BASANGO_ENV_PATH",
      "BASANGO_DATABASE_URL",
      "BASANGO_DATABASE_LEGACY_HOST",
      "BASANGO_DATABASE_LEGACY_PASSWORD",
      "BASANGO_DATABASE_LEGACY_NAME",
      "BASANGO_DATABASE_LEGACY_USER",
      "BASANGO_CRAWLER_ROOT_PATH",
      "BASANGO_CRAWLER_DATA_PATH",
      "BASANGO_CRAWLER_SQLITE_PATH",
      "BASANGO_CRAWLER_LOGS_PATH",
      "BASANGO_CRAWLER_CONFIG_PATH",
      "BASANGO_CRAWLER_SOURCE_IDS",
      "BASANGO_CRAWLER_UPDATE_DIRECTION",
      "BASANGO_CRAWLER_FETCH_USER_AGENT",
      "BASANGO_CRAWLER_FETCH_MAX_RETRIES",
      "BASANGO_CRAWLER_FETCH_RESPECT_RETRY_AFTER",
      "BASANGO_CRAWLER_ASYNC_REDIS_URL",
      "BASANGO_CRAWLER_ASYNC_TTL_RESULT",
      "BASANGO_CRAWLER_ASYNC_TTL_FAILURE",
      "BASANGO_CRAWLER_ASYNC_QUEUE_LISTING",
      "BASANGO_CRAWLER_ASYNC_QUEUE_DETAILS",
      "BASANGO_CRAWLER_ASYNC_QUEUE_PROCESSING",
      "BASANGO_ENCRYPTION_KEY",
      "BASANGO_LOGGER_LEVEL",
      "BASANGO_LOGGER_PRETTY",
    ] as const,
    path: findEnvPath(),
  },
  schema: z.object({
    api: ApiConfigurationSchema,
    crawler: CrawlerConfigurationSchema,
    database: DatabaseConfigurationSchema,
    encryption: EncryptionConfigurationSchema,
    logger: LoggerConfigurationSchema,
    shared: SharedConfigurationSchema,
  }),
  sources: [apiConfig, crawlerConfig, databaseConfig, encryptionConfig, loggerConfig, sharedConfig],
});
