import { type Database, db } from "@basango/db/client";

import type { Session } from "#api/utils/auth";

export const withDatabase = async <TReturn>(opts: {
  ctx: {
    session?: Session | null;
    db: Database;
  };
  next: (opts: {
    ctx: {
      session?: Session | null;
      db: Database;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  ctx.db = db;
  return await next({ ctx });
};
