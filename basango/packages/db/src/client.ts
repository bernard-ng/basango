import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@basango/db/schema";

const isDevelopment = process.env.NODE_ENV === "development";

const connectionConfig = {
  max: isDevelopment ? 8 : 12,
  idleTimeoutMillis: isDevelopment ? 5_000 : 60_000,
  connectionTimeoutMillis: 15_000,
  maxUses: isDevelopment ? 100 : 0,
  allowExitOnIdle: true,
};

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ?? process.env.DATABASE_PRIMARY_URL!,
  ...connectionConfig,
});

// Lightweight connection pool monitoring (single pool)
export const getConnectionPoolStats = () => {
  const stats = {
    name: "primary",
    total: pool.options.max ?? 0,
    idle: pool.idleCount ?? 0,
    active: Math.max(0, (pool.totalCount ?? 0) - (pool.idleCount ?? 0)),
    waiting: pool.waitingCount ?? 0,
    ended: (pool as any).ended ?? false,
  };

  const totalConnections = connectionConfig.max;
  const utilization =
    totalConnections > 0
      ? Math.round((stats.active / totalConnections) * 100)
      : 0;

  return {
    timestamp: new Date().toISOString(),
    region: process.env.FLY_REGION || "unknown",
    instance: process.env.FLY_ALLOC_ID || "local",
    pools: { primary: stats },
    summary: {
      totalConnections,
      totalActive: stats.active,
      totalWaiting: stats.waiting,
      hasExhaustedPools:
        stats.active >= totalConnections || (stats.waiting ?? 0) > 0,
      utilizationPercent: utilization,
    },
  };
};

export const db = drizzle(pool, {
  schema,
  casing: "snake_case",
});
export const connectDb = async () => db;
export type Database = Awaited<ReturnType<typeof connectDb>>;
