import type { SearchEngine } from "@basango/search/engine";
import type { McpServer } from "@modelcontextprotocol/server";
import z from "zod";

import type { Database } from "#db/client";
import { getArticleById, getArticles } from "#db/queries/public";
import { ArticleListSchema, ArticleSchema, ArticleSearchSchema } from "#domain/models/public";

import { readOnlyAnnotations, result } from "./toolkit";

const articleListInputSchema = ArticleListSchema.omit({
  publishedAfter: true,
  publishedBefore: true,
}).extend({
  publishedAfter: z.iso.datetime({ offset: true }).optional(),
  publishedBefore: z.iso.datetime({ offset: true }).optional(),
});

const articleSearchInputSchema = ArticleSearchSchema.omit({
  publishedAfter: true,
  publishedBefore: true,
}).extend({
  publishedAfter: z.iso.datetime({ offset: true }).optional(),
  publishedBefore: z.iso.datetime({ offset: true }).optional(),
});

export function registerArticleTools(
  server: McpServer,
  database: Database,
  searchEngine: SearchEngine,
) {
  server.registerTool(
    "list_articles",
    {
      annotations: readOnlyAnnotations,
      description:
        "List Basango articles newest first. Filter by sourceId, categoryId, or inclusive publishedAfter/publishedBefore ISO-8601 instants. For relative dates, calculate boundaries in Africa/Lubumbashi.",
      inputSchema: articleListInputSchema,
      title: "List articles",
    },
    async (input: z.input<typeof articleListInputSchema>) => {
      return result(await getArticles(database, ArticleListSchema.parse(input)));
    },
  );

  server.registerTool(
    "search_articles",
    {
      annotations: readOnlyAnnotations,
      description:
        "Search Basango article titles and bodies by relevance. Filter by sourceId, categoryId, sentiment, or inclusive publishedAfter/publishedBefore ISO-8601 instants.",
      inputSchema: articleSearchInputSchema,
      title: "Search articles",
    },
    async (input: z.input<typeof articleSearchInputSchema>) => {
      const parsed = ArticleSearchSchema.parse(input);

      return result(
        await searchEngine.search({
          ...parsed,
          limit: parsed.limit ?? 20,
          page: parsed.page ?? 1,
        }),
      );
    },
  );

  server.registerTool(
    "get_article",
    {
      annotations: readOnlyAnnotations,
      description:
        "Get one Basango article by ID, including its full stored body and original publisher link.",
      inputSchema: ArticleSchema,
      title: "Get article",
    },
    async ({ id }) => {
      return result(await getArticleById(database, id));
    },
  );
}
