import path from "node:path";

import { loadConfig as defineConfig } from "@devscast/config";
import { z } from "zod";

export const PROJECT_DIR = path.resolve(__dirname, "../");

const ServerConfigurationSchema = z.object({
  cors: z.object({
    allowedHeaders: z.array(z.string()).optional(),
    allowMethods: z.array(z.string()).optional(),
    exposeHeaders: z.array(z.string()).optional(),
    maxAge: z.number().int().min(0).optional(),
    origin: z
      .array(z.string())
      .optional()
      .default(["http://localhost:3000", "http://127.0.0.1:3000", "https://dashboard.basango.io"]),
  }),
  server: z.object({
    host: z.string().default("localhost"),
    port: z.number().int().min(1).max(65535).default(4000),
    version: z.string().default("1.0.0"),
  }),
});

export const { env, config } = defineConfig({
  env: {
    knownKeys: [
      "BASANGO_API_HOST",
      "BASANGO_API_PORT",
      "BASANGO_API_ALLOWED_ORIGINS",
      "BASANGO_API_KEY",
      "BASANGO_CRAWLER_TOKEN",
      "BASANGO_JWT_SECRET",
    ],
    path: path.join(PROJECT_DIR, ".env"),
  },
  schema: ServerConfigurationSchema,
  sources: [
    path.join(PROJECT_DIR, "config", "server.json"),
    path.join(PROJECT_DIR, "config", "cors.json"),
  ],
});

export type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;
