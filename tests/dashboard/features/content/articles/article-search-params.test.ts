import { describe, expect, test } from "bun:test";

import {
  articleSearchParamsSchema,
  resolveArticleSearchDates,
} from "../../../../../apps/dashboard/src/features/content/articles/article-search-params";

describe("article search page parameters", () => {
  test("normalizes a valid shareable search", () => {
    expect(
      articleSearchParamsSchema.parse({
        after: "2026-08-01",
        before: "2026-09-04",
        category: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc",
        q: "  Goma  ",
        scope: "title",
        sentiment: "neutral",
        sort: "newest",
      }),
    ).toEqual({
      after: "2026-08-01",
      before: "2026-09-04",
      category: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc",
      q: "Goma",
      scope: "title",
      sentiment: "neutral",
      sort: "newest",
    });
  });

  test("drops invalid optional filters", () => {
    expect(
      articleSearchParamsSchema.parse({
        after: "yesterday",
        before: "2026-13-40",
        category: "not-an-id",
        q: "Goma",
        scope: "body",
        sentiment: "mixed",
        sort: "oldest",
      }),
    ).toEqual({ q: "Goma" });
  });

  test("expands date filters to inclusive UTC day bounds", () => {
    expect(resolveArticleSearchDates({ after: "2026-08-01", before: "2026-09-04" })).toEqual({
      publishedAfter: new Date("2026-08-01T00:00:00.000Z"),
      publishedBefore: new Date("2026-09-04T23:59:59.999Z"),
    });
  });
});
