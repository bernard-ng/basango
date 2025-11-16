import { DateRange, ID } from "@basango/domain/models";

export type CategoryShare = {
  category: string;
  count: number;
  percentage: number;
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
