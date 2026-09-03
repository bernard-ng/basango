import { describe, expect, test } from "bun:test";

import { buildCategoryDistributionChartModel } from "../../../../../apps/dashboard/src/features/content/sources/category-distribution-model";

describe("category distribution chart model", () => {
  test("creates one bar per cluster and one series per original category", () => {
    const model = buildCategoryDistributionChartModel([
      {
        articleCount: 2,
        category: "Society",
        categoryId: "society-id",
        originalCategories: [
          { category: "Government", count: 1 },
          { category: "Culture", count: 1 },
        ],
        slug: "society",
      },
      {
        articleCount: 5,
        category: "Politics",
        categoryId: "politics-id",
        originalCategories: [
          { category: "Elections", count: 3 },
          { category: "Government", count: 2 },
        ],
        slug: "politics",
      },
    ]);

    expect(model.series.map(({ category, count }) => ({ category, count }))).toEqual([
      { category: "Elections", count: 3 },
      { category: "Government", count: 3 },
      { category: "Culture", count: 1 },
    ]);
    expect(model.data).toEqual([
      {
        articleCount: 5,
        category: "Politics",
        categorySlug: "politics",
        originalCategory0: 3,
        originalCategory1: 2,
      },
      {
        articleCount: 2,
        category: "Society",
        categorySlug: "society",
        originalCategory1: 1,
        originalCategory2: 1,
      },
    ]);
  });

  test("returns an empty model when the source has no categorized articles", () => {
    expect(buildCategoryDistributionChartModel([])).toEqual({ data: [], series: [] });
  });
});
