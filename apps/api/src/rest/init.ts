import type { Database } from "@basango/db/client";

import type { AuthSession } from "#api/auth";

export type Context = {
  Variables: {
    db: Database;
    session: AuthSession;
  };
};
