import type { McpServer } from "@modelcontextprotocol/server";
import z from "zod";

import type { Database } from "#db/client";
import { getCategories } from "#db/queries/public";

import { readOnlyAnnotations, result } from "./toolkit";

export function registerCategoryTools(server: McpServer, database: Database) {
  server.registerTool(
    "list_categories",
    {
      annotations: readOnlyAnnotations,
      description:
        "List the managed Basango article categories. Use a category ID to filter list_articles.",
      inputSchema: z.object({}),
      title: "List categories",
    },
    async () => {
      return result(await getCategories(database));
    },
  );
}
