import { md5 } from "@basango/encryption";
import { count, eq } from "drizzle-orm";
import { v7 as uuidV7 } from "uuid";

import { Database } from "#db/client";
import { getSourceIdByName } from "#db/queries/sources";
import { ArticleMetadata, Sentiment, TokenStatistics, articles } from "#db/schema";
import { computeReadingTime, computeTokenStatistics } from "#db/utils/computed";

export type CreateArticleParams = {
  title: string;
  body: string;
  categories: string[];
  link: string;
  sourceId: string;
  publishedAt: Date;
  sentiment?: Sentiment;
  tokenStatistics?: TokenStatistics;
  readingTime?: number;
  metadata?: ArticleMetadata;
};

export async function createArticle(db: Database, params: CreateArticleParams) {
  const data = {
    ...params,
    hash: md5(params.link),
    readingTime: computeReadingTime(params.body),
    sentiment: "neutral" as Sentiment,
    sourceId: await getSourceIdByName(db, params.sourceId),
    tokenStatistics: computeTokenStatistics({
      body: params.body,
      categories: params.categories,
      title: params.title,
    }),
  };

  const duplicated = await getArticleByHash(db, data.hash);
  if (duplicated !== undefined) {
    return {
      id: duplicated.id,
      sourceId: duplicated.sourceId,
    };
  }

  const [result] = await db
    .insert(articles)
    .values({ id: uuidV7(), ...data })
    .returning({
      id: articles.id,
      sourceId: articles.sourceId,
    });

  if (result === undefined) {
    throw new Error("Failed to create article");
  }

  return result;
}

export async function getArticleByHash(db: Database, hash: string) {
  return await db.query.articles.findFirst({
    where: eq(articles.hash, hash),
  });
}

export async function countArticlesBySourceId(db: Database, sourceId: string) {
  const result = await db
    .select({ count: count(articles.id) })
    .from(articles)
    .where(eq(articles.sourceId, sourceId))
    .then((res) => res[0]);

  return result?.count ?? 0;
}
