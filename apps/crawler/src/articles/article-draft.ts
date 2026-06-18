import type { ArticleMetadata } from "@basango/domain/models";

export interface ArticleDraft {
  body: string;
  categories?: string[];
  link: string;
  metadata?: ArticleMetadata;
  publishedAt: Date;
  sourceId: string;
  title: string;
}
