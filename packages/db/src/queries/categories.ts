import { asc, desc } from "drizzle-orm";

import { Database } from "#db/client";
import { categories } from "#db/schema";

export async function getCategories(db: Database) {
  return db.query.categories.findMany({
    orderBy: [desc(categories.weight), asc(categories.name)],
  });
}
