import path from "node:path";

import { loadConfig } from "@devscast/config";
import { z } from "zod";

const PROJECT_DIR = path.resolve(__dirname, "../");

export const { env, config } = loadConfig({
  env: {
    knownKeys: [
      "BASANGO_DATABASE_URL",
      "BASANGO_SOURCE_DATABASE_HOST",
      "BASANGO_SOURCE_DATABASE_USER",
      "BASANGO_SOURCE_DATABASE_PASS",
      "BASANGO_SOURCE_DATABASE_NAME",
    ] as const,
    path: path.join(PROJECT_DIR, ".env"),
  },
  schema: z.object({}),
});
