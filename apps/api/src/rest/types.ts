import type { Database } from "@basango/db/client";

export type Context = {
  Variables: {
    db: Database;
  };
};
