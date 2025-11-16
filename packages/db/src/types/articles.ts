import { ArticleMetadata, ID, Sentiment, TokenStatistics } from "@basango/domain/models";

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

export type GetArticleByIdParams = {
  id: ID;
};

export type GetArticlesParams = {
  cursor?: string | null;
  limit?: number;
  search?: string;
  sentiment?: Sentiment;
  sourceId?: string;
  category?: string;
};
