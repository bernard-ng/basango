import type { Article } from "@basango/domain/models";
import { md5 } from "@basango/encryption";
import { logger } from "@basango/logger";

import { type ArticleDraft } from "#crawler/articles/article-draft";
import { ArticleForwarder } from "#crawler/articles/article-forwarder";
import type { ArticleOutbox } from "#crawler/articles/article-outbox";

const sanitize = (text: string): string => {
  if (!text) return text;

  let s = text.replace(/\u00A0/g, " ");
  s = s.replace(" ", " ");
  s = s.replace(" ", " ");
  s = s.replace(/\u200B/g, "");
  s = s.replace(/\u200C/g, "");
  s = s.replace(/\u200D/g, "");
  s = s.replace(/\uFEFF/g, "");
  s = s.replace(/\r\n/g, "\n");
  s = s.replace(/\n{2,}/g, "\n");

  return s.trim();
};

export const normalizeArticle = (payload: Partial<Article> | ArticleDraft): Article => {
  if (!payload.body || !payload.link || !payload.title) {
    throw new Error("Cannot ingest incomplete article record");
  }

  if (!payload.publishedAt || Number.isNaN(new Date(payload.publishedAt).getTime())) {
    throw new Error("Cannot ingest article record without a valid publishedAt date");
  }

  const hash = "hash" in payload && payload.hash ? payload.hash : md5(payload.link);

  return {
    ...payload,
    body: sanitize(payload.body),
    categories: (payload.categories ?? []).map(sanitize),
    hash,
    title: sanitize(payload.title),
  } as Article;
};

export interface IngestArticleOptions {
  articleOutbox: ArticleOutbox;
}

export const ingestArticle = async (
  payload: Partial<Article> | ArticleDraft,
  options: IngestArticleOptions,
): Promise<Article> => {
  const article = normalizeArticle(payload);

  let alreadyForwarded = false;
  try {
    const result = options.articleOutbox.save(article);
    if (result?.status === "forwarded") {
      alreadyForwarded = true;
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to save article to SQLite outbox");
    throw new Error("Failed to save article to outbox");
  }

  if (alreadyForwarded) {
    logger.info({ url: article.link }, "article already forwarded");
    return article;
  }

  const articleForwarder = new ArticleForwarder();
  const result = await articleForwarder.forward(article);
  if (!result.ok) {
    const error = new Error(result.message ?? "Failed to forward article");
    options.articleOutbox.markFailed(article, error, result.retryable);
    throw error;
  }

  options.articleOutbox.markForwarded(article);

  logger.info({ url: article.link }, "article successfully ingested");
  return article;
};
