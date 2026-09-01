import type { McpServer } from "@modelcontextprotocol/server";

import type { Database } from "#db/client";
import { getSourceById, getSources } from "#db/queries/public";
import { SourceListSchema, SourceSchema } from "#domain/models/public";

import { readOnlyAnnotations, result } from "./toolkit";

export function registerSourceTools(server: McpServer, database: Database) {
  server.registerTool(
    "list_sources",
    {
      annotations: readOnlyAnnotations,
      description:
        "List media sources available in Basango. Use search to resolve a publisher name before filtering list_articles by sourceId.",
      inputSchema: SourceListSchema,
      title: "List sources",
    },
    async (input) => {
      return result(await getSources(database, undefined, input));
    },
  );

  server.registerTool(
    "get_source",
    {
      annotations: readOnlyAnnotations,
      description: "Get one Basango media source by ID, including its article count and website.",
      inputSchema: SourceSchema,
      title: "Get source",
    },
    async ({ id }) => {
      return result(await getSourceById(database, undefined, id));
    },
  );
}
