import { createTRPCRouter } from "#api/trpc/init";
import { articlesRouter } from "#api/trpc/routers/public/articles";
import { bookmarksRouter } from "#api/trpc/routers/public/bookmarks";
import { categoriesRouter } from "#api/trpc/routers/public/categories";
import { commentsRouter } from "#api/trpc/routers/public/comments";
import { sourcesRouter } from "#api/trpc/routers/public/sources";

export const publicRouter = createTRPCRouter({
  articles: articlesRouter,
  bookmarks: bookmarksRouter,
  categories: categoriesRouter,
  comments: commentsRouter,
  sources: sourcesRouter,
});
