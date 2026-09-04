import { describe, expect, test } from "bun:test";

import { articleSearchParamsSchema } from "../../../../../apps/dashboard/src/features/content/articles/article-search-params";

describe("article search page parameters", () => {
  test("normalizes a valid shareable search", () => {
    expect(
      articleSearchParamsSchema.parse({
        category: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc",
        q: "  Goma  ",
        sentiment: "neutral",
      }),
    ).toEqual({
      category: "0198f0e2-5c2d-7bba-ae95-3d7eae12b2bc",
      q: "Goma",
      sentiment: "neutral",
    });
  });

  test("drops invalid optional filters", () => {
    expect(
      articleSearchParamsSchema.parse({
        category: "not-an-id",
        q: "Goma",
        sentiment: "mixed",
      }),
    ).toEqual({ q: "Goma" });
  });
});
