import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/schema";

const isDevelopment = process.env.NODE_ENV === "development";

const connectionConfig = {
  allowExitOnIdle: true,
  connectionTimeoutMillis: 15_000,
  idleTimeoutMillis: isDevelopment ? 5_000 : 60_000,
  max: isDevelopment ? 8 : 12,
  maxUses: isDevelopment ? 100 : 0,
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL ?? process.env.DATABASE_PRIMARY_URL!,
  ...connectionConfig,
});

// Lightweight connection pool monitoring (single pool)
export const getConnectionPoolStats = () => {
  const stats = {
    active: Math.max(0, (pool.totalCount ?? 0) - (pool.idleCount ?? 0)),
    ended: (pool as any).ended ?? false,
    idle: pool.idleCount ?? 0,
    name: "primary",
    total: pool.options.max ?? 0,
    waiting: pool.waitingCount ?? 0,
  };

  const totalConnections = connectionConfig.max;
  const utilization =
    totalConnections > 0 ? Math.round((stats.active / totalConnections) * 100) : 0;

  return {
    instance: process.env.FLY_ALLOC_ID || "local",
    pools: { primary: stats },
    region: process.env.FLY_REGION || "unknown",
    summary: {
      hasExhaustedPools: stats.active >= totalConnections || (stats.waiting ?? 0) > 0,
      totalActive: stats.active,
      totalConnections,
      totalWaiting: stats.waiting,
      utilizationPercent: utilization,
    },
    timestamp: new Date().toISOString(),
  };
};

export const db = drizzle(pool, {
  casing: "snake_case",
  schema,
});
export const connectDb = async () => db;
export type Database = Awaited<ReturnType<typeof connectDb>>;
