import { md5 } from "@basango/encryption";
import { eq } from "drizzle-orm";
import { v7 as uuidV7 } from "uuid";

import { Database } from "@/client";
import { ArticleMetadata, Sentiment, TokenStatistics, article } from "@/schema";
import { computeReadingTime, computeTokenStatistics } from "@/utils/computed";

import { getSourceIdByName } from "./sources";

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
    .insert(article)
    .values({ id: uuidV7(), ...data })
    .returning({
      id: article.id,
      sourceId: article.sourceId,
    });

  if (result === undefined) {
    throw new Error("Failed to create article");
  }

  return result;
}

export async function getArticleByHash(db: Database, hash: string) {
  return db.query.article.findFirst({
    where: eq(article.hash, hash),
  });
}
