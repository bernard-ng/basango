import { createEnvAccessor } from "@devscast/config";
import { defineConfig } from "drizzle-kit";

const env = createEnvAccessor(["BASANGO_DATABASE_URL"] as const);

export default defineConfig({
  dbCredentials: {
    url: env("BASANGO_DATABASE_URL"),
  },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema.ts",
});
