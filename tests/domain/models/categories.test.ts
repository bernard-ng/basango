import { describe, expect, test } from "bun:test";

import {
  createCategorySchema,
  updateCategorySchema,
} from "../../../packages/domain/src/models/categories";

describe("category management contracts", () => {
  test("normalizes a managed category payload", () => {
    const category = createCategorySchema.parse({
      candidates: [" politique ", "élections"],
      description: "Government news",
      name: " Politics ",
      slug: "politics-government",
      weight: 10,
    });

    expect(category.name).toBe("Politics");
    expect(category.candidates).toEqual(["politique", "élections"]);
  });

  test("rejects invalid slugs and empty candidate lists", () => {
    expect(
      createCategorySchema.safeParse({
        candidates: [],
        name: "Politics",
        slug: "Politics & Government",
        weight: 10,
      }).success,
    ).toBeFalse();
  });

  test("requires an id when updating a category", () => {
    expect(
      updateCategorySchema.safeParse({
        candidates: ["politique"],
        name: "Politics",
        slug: "politics",
        weight: 10,
      }).success,
    ).toBeFalse();
  });
});
