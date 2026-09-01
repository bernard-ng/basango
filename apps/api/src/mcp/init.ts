import { logger } from "@basango/logger";
import { McpServer, createMcpHandler } from "@modelcontextprotocol/server";

import type { Database } from "#db/client";
import { db } from "#db/client";

import { withMcpAuth } from "./middlewares/auth";
import { registerArticleTools } from "./tools/articles";
import { registerCategoryTools } from "./tools/categories";
import { registerSourceTools } from "./tools/sources";

export function createMcpServer(database: Database) {
  const server = new McpServer(
    { name: "Basango", version: "1.0.0" },
    {
      instructions:
        "Basango provides read-only access to articles from Congolese media sources. Use list_sources to resolve a source ID when the user names a publisher, then use list_articles with sourceId. Use search for words expected in article titles. Use publishedAfter and publishedBefore for time periods, interpreting relative dates in Africa/Lubumbashi. List results contain summaries; call get_article only when the full body is needed. Include the article title, source, publication time, and original link when answering factual questions.",
    },
  );

  registerArticleTools(server, database);
  registerSourceTools(server, database);
  registerCategoryTools(server, database);

  return server;
}

const handler = createMcpHandler(() => createMcpServer(db), {
  onerror: (error) => logger.error({ error }, "MCP request failed"),
});

export const mcpRouter = withMcpAuth(async (request) => {
  const response = await handler.fetch(request);
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
});
