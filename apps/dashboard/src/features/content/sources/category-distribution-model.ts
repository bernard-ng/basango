import type { RouterOutputs } from "@basango/api/trpc/routers/_app";

type CategoryDistributionItem =
  RouterOutputs["sources"]["getCategoryDistribution"]["items"][number];

export type CategoryDistributionSeries = {
  category: string;
  count: number;
  dataKey: string;
};

export type CategoryDistributionDatum = {
  articleCount: number;
  category: string;
  categorySlug: string;
  [key: string]: number | string;
};

export type CategoryDistributionChartModel = {
  data: CategoryDistributionDatum[];
  series: CategoryDistributionSeries[];
};

export function buildCategoryDistributionChartModel(
  items: readonly CategoryDistributionItem[],
): CategoryDistributionChartModel {
  const totalsByOriginalCategory = new Map<string, number>();

  for (const item of items) {
    for (const originalCategory of item.originalCategories) {
      const current = totalsByOriginalCategory.get(originalCategory.category) ?? 0;

      totalsByOriginalCategory.set(originalCategory.category, current + originalCategory.count);
    }
  }

  const series = Array.from(totalsByOriginalCategory.entries())
    .sort(([leftCategory, leftCount], [rightCategory, rightCount]) => {
      return rightCount - leftCount || leftCategory.localeCompare(rightCategory, "fr");
    })
    .map(([category, count], index) => ({
      category,
      count,
      dataKey: `originalCategory${index}`,
    }));
  const seriesByCategory = new Map(series.map((item) => [item.category, item.dataKey]));
  const data = [...items]
    .sort((left, right) => {
      return (
        right.articleCount - left.articleCount || left.category.localeCompare(right.category, "fr")
      );
    })
    .map((item) => {
      const datum: CategoryDistributionDatum = {
        articleCount: item.articleCount,
        category: item.category,
        categorySlug: item.slug,
      };

      for (const originalCategory of item.originalCategories) {
        const dataKey = seriesByCategory.get(originalCategory.category);

        if (dataKey) {
          datum[dataKey] = originalCategory.count;
        }
      }

      return datum;
    });

  return { data, series };
}
