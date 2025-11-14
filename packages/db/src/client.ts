import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { env } from "#db/config";
import * as schema from "#db/schema";

const isDevelopment = process.env.NODE_ENV === "development";

const pool = new Pool({
  allowExitOnIdle: true,
  connectionString: env("BASANGO_DATABASE_URL"),
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: isDevelopment ? 5_000 : 60_000,
  max: isDevelopment ? 8 : 12,
  maxUses: isDevelopment ? 100 : 0,
});

export const db = drizzle(pool, {
  casing: "snake_case",
  schema,
});
export const connectDb = async () => db;
export type Database = Awaited<ReturnType<typeof connectDb>>;
