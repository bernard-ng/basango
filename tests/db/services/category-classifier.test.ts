import { describe, expect, test } from "bun:test";

import { classifyCategory } from "../../../packages/db/src/services/category-classifier";

const configured = [
  {
    candidates: ["actualité"],
    id: "019c0000-0000-7000-8000-000000000001",
    name: "News",
    slug: "news",
    weight: 2,
  },
  {
    candidates: ["politique", "actualité"],
    id: "019c0000-0000-7000-8000-000000000002",
    name: "Politics",
    slug: "politics",
    weight: 10,
  },
];

describe("managed category classifier", () => {
  test("uses edited candidates and normalizes accents", () => {
    const result = classifyCategory(
      {
        categories: ["Actualite", "POLITIQUE"],
        id: "019c0000-0000-7000-8000-000000000010",
      },
      configured,
    );

    expect(result.category.slug).toBe("politics");
    expect(result.matches).toBe(2);
  });

  test("falls back to the lowest-weight managed category", () => {
    const result = classifyCategory(
      {
        categories: ["unknown-label"],
        id: "019c0000-0000-7000-8000-000000000011",
      },
      configured,
    );

    expect(result.category.slug).toBe("news");
    expect(result.matches).toBe(0);
  });
});
