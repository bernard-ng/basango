#!/usr/bin/env bun

import { logger } from "@basango/logger";

import { connectDb } from "#db/client";
import { CategoryClassifier } from "#db/services/category-classifier.js";

async function main() {
  const db = await connectDb();
  const service = new CategoryClassifier(db);

  await service.classifyPendingArticles();
}

main().catch((error) => {
  logger.error({ error }, "Category clustering failed");
  process.exit(1);
});
