import { ArticleMetadata, ID, Sentiment, TokenStatistics } from "@basango/domain/models";

export type CreateArticleParams = {
  categoryId?: string | null;
  clustered?: boolean;
  title: string;
  body: string;
  categories?: string[];
  hash: string;
  link: string;
  sourceId: string;
  publishedAt: Date;
  sentiment?: Sentiment;
  tokenStatistics?: TokenStatistics;
  readingTime?: number;
  metadata?: ArticleMetadata;
};

export type GetArticleByIdParams = {
  id: ID;
};

export type GetArticlesParams = {
  limit?: number;
  page?: number;
  search?: string;
  sentiment?: Sentiment;
  sourceId?: string;
  category?: string;
};
