import { config } from "@basango/domain/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "#db/schema";

const isDevelopment = process.env.NODE_ENV === "development";

const pool = new Pool({
  allowExitOnIdle: true,
  connectionString: config.database.url,
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
