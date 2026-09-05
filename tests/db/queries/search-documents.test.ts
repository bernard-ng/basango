import { describe, expect, spyOn, test } from "bun:test";

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import { markArticleSearchDirty } from "../../../packages/db/src/queries/search-documents";

const articleIds = ["01a072d8-de9e-777a-a05a-4e3093218cfc", "01a072d8-de9e-777a-a05a-4e3093218cfd"];

describe("markArticleSearchDirty", () => {
  test.each([articleIds.slice(0, 1), articleIds])(
    "binds article IDs as one PostgreSQL array: %j",
    async (...ids) => {
      const pool = new Pool();
      let queryArguments: unknown[] = [];
      // Drizzle uses the promise overload; pg also declares stream and callback overloads.
      const query = spyOn(pool, "query").mockImplementation((async (...args: unknown[]) => {
        queryArguments = args;

        return { command: "INSERT", fields: [], oid: 0, rowCount: 0, rows: [] };
      }) as typeof pool.query);
      const db = drizzle(pool);

      try {
        await markArticleSearchDirty(db, ids);

        expect(query).toHaveBeenCalledTimes(1);
        expect(queryArguments[1]).toEqual(["upsert", ids]);
      } finally {
        query.mockRestore();
        await pool.end();
      }
    },
  );
});
