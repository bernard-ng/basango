export type ArticleSearchScope = "all" | "title";

export type ArticleSearchSort = "newest" | "relevance";

export type ArticleSearchFilterState = {
  categoryId?: string;
  publishedAfter?: string;
  publishedBefore?: string;
  sentiment?: "negative" | "neutral" | "positive";
  sourceId?: string;
};

export type ArticleSearchReferenceOption = {
  id: string;
  name: string;
};
