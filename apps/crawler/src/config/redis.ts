import type { RedisOptions } from "ioredis";

export const parseRedisUrl = (url: string): RedisOptions => {
  if (!url.startsWith("redis://")) {
    return {};
  }

  const parsed = new URL(url);
  return {
    db: Number(parsed.pathname?.replace("/", "") || 0),
    host: parsed.hostname,
    password: parsed.password || undefined,
    port: Number(parsed.port || 6379),
  };
};
