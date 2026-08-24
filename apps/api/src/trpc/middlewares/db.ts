import { type Database, db } from "@basango/db/client";

import type { AuthSession } from "#api/auth";

export const withDatabase = async <TReturn>(opts: {
  ctx: {
    session?: AuthSession | null;
    db: Database;
  };
  next: (opts: {
    ctx: {
      session?: AuthSession | null;
      db: Database;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  ctx.db = db;
  return await next({ ctx });
};
