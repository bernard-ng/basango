import { type Database, db } from "@basango/db/client";
import type { SearchEngine } from "@basango/search/engine";

import type { AuthSession } from "#api/auth";

export const withDatabase = async <TReturn>(opts: {
  ctx: {
    session?: AuthSession | null;
    db: Database;
    searchEngine: SearchEngine;
  };
  next: (opts: {
    ctx: {
      session?: AuthSession | null;
      db: Database;
      searchEngine: SearchEngine;
    };
  }) => Promise<TReturn>;
}) => {
  const { ctx, next } = opts;

  ctx.db = db;
  return await next({ ctx });
};
