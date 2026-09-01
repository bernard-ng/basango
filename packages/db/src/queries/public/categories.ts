import { asc, desc } from "drizzle-orm";

import type { Database } from "#db/client";
import { categories } from "#db/schema";

export async function getCategories(db: Database) {
  return db
    .select({
      description: categories.description,
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
    })
    .from(categories)
    .orderBy(desc(categories.weight), asc(categories.name));
}
