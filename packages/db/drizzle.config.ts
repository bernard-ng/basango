import { defineConfig } from "drizzle-kit";

import { env } from "./src/config";

export default defineConfig({
  dbCredentials: {
    url: env("BASANGO_DATABASE_URL"),
  },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema.ts",
});
