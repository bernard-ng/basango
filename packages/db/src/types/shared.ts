import { DateRange, ID } from "@basango/domain/models";

export type CategoryShare = {
  categoryId: string;
  category: string;
  count: number;
  percentage: number;
  slug: string;
};

export type CategoryShares = {
  items: CategoryShare[];
  total: number;
};

export type GetPublicationsParams = {
  id?: ID;
  range?: DateRange;
};

export type GetCategorySharesParams = {
  id: ID;
  limit?: number;
};

export type GetDistributionsParams = {
  limit?: number;
};
