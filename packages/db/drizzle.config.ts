import { readEnvFile } from "@basango/domain/config/environment";
import { defineConfig } from "drizzle-kit";

const databaseUrl = (
  process.env.BASANGO_DATABASE_URL ?? readEnvFile().BASANGO_DATABASE_URL
)?.trim();

if (!databaseUrl) {
  throw new Error("BASANGO_DATABASE_URL is required to run Drizzle Kit.");
}

export default defineConfig({
  dbCredentials: {
    url: databaseUrl,
  },
  dialect: "postgresql",
  out: "./migrations",
  schema: "./src/schema.ts",
});
