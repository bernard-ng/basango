import type { Settings } from "meilisearch";

import type { SearchDocument } from "../indexer";

export const ARTICLE_RETRIEVED_ATTRIBUTES = [
  "categories",
  "categoryId",
  "categoryName",
  "categorySlug",
  "excerpt",
  "id",
  "image",
  "link",
  "publishedAt",
  "readingTime",
  "sentiment",
  "sourceDisplayName",
  "sourceId",
  "sourceName",
  "sourceUrl",
  "title",
] as const satisfies readonly (keyof SearchDocument)[];

export const ARTICLE_INDEX_SETTINGS = {
  displayedAttributes: [...ARTICLE_RETRIEVED_ATTRIBUTES],
  faceting: {
    maxValuesPerFacet: 100,
  },
  filterableAttributes: ["sourceId", "categoryId", "sentiment", "publishedAtTimestamp"],
  pagination: {
    maxTotalHits: 100_000,
  },
  rankingRules: [
    "words",
    "typo",
    "proximity",
    "attributeRank",
    "wordPosition",
    "exactness",
    "publishedAtTimestamp:desc",
  ],
  searchableAttributes: ["title", "body"],
  sortableAttributes: ["publishedAtTimestamp"],
} satisfies Settings;

export function hasExpectedSettings(current: Settings): boolean {
  return Object.entries(ARTICLE_INDEX_SETTINGS).every(([name, expected]) => {
    const actual = current[name as keyof Settings];

    if (
      (name === "filterableAttributes" || name === "sortableAttributes") &&
      Array.isArray(actual) &&
      Array.isArray(expected)
    ) {
      return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort());
    }

    return matchesExpected(actual, expected);
  });
}

function matchesExpected(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    return Array.isArray(actual) && JSON.stringify(actual) === JSON.stringify(expected);
  }

  if (isRecord(expected)) {
    return (
      isRecord(actual) &&
      Object.entries(expected).every(([name, value]) => matchesExpected(actual[name], value))
    );
  }

  return actual === expected;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
