import { config } from "@basango/domain/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dbCredentials: {
    url: config.database.url,
  },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema.ts",
});
