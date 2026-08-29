import { describe, expect, test } from "bun:test";

import { classifyCategory } from "../../../packages/db/src/services/category-classifier";
import { Categories } from "../../../packages/domain/src/models/categories";

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

  test("classifies common source labels with the static category map", () => {
    const expectations = {
      "actualite-en-rdc": "actualites-faits-divers",
      actualites: "actualites-faits-divers",
      "actualites-en": "actualites-faits-divers",
      "actualites-sw": "actualites-faits-divers",
      alaune: "actualites-faits-divers",
      ama: "actualites-faits-divers",
      climat: "sciences-technologies-environnement",
      competition: "sports",
      depeches: "actualites-faits-divers",
      "environnement-en": "sciences-technologies-environnement",
      "environnement-sw": "sciences-technologies-environnement",
      focus: "actualites-faits-divers",
      foret: "sciences-technologies-environnement",
      "french-news-release": "actualites-faits-divers",
      gouvernance: "politique-gouvernement",
      international: "international-regions",
      "international-2": "international-regions",
      internationales: "international-regions",
      "lactualite-en-rdc": "actualites-faits-divers",
      nation: "actualites-faits-divers",
      securite: "politique-gouvernement",
      "securite-defense": "politique-gouvernement",
      social: "societe-vie-quotidienne",
      sécurité: "politique-gouvernement",
    } as const;

    for (const [label, expectedSlug] of Object.entries(expectations)) {
      const result = classifyCategory({ categories: [label], id: label }, Categories);

      expect(result.category.slug).toBe(expectedSlug);
    }
  });
});
