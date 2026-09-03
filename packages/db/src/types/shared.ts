import type { DateRange, ID } from "@basango/domain/models";

export type OriginalCategoryDistribution = {
  category: string;
  count: number;
};

export type CategoryDistributionItem = {
  articleCount: number;
  categoryId: string;
  category: string;
  originalCategories: OriginalCategoryDistribution[];
  slug: string;
};

export type CategoryDistribution = {
  items: CategoryDistributionItem[];
  total: number;
};

export type CategoryDistributionRow = {
  articleCount: number;
  categoryId: string;
  category: string;
  count: number;
  originalCategory: string;
  slug: string;
};

export type GetPublicationsParams = {
  id?: ID;
  range?: DateRange;
};

export type GetCategoryDistributionParams = {
  id: ID;
};

export type GetDistributionsParams = {
  limit?: number;
};
