import type { Credibility, ID, PaginationRequest } from "@basango/domain/models";

export type UpdateSourceParams = {
  id: ID;
  name?: string;
  displayName?: string;
  description?: string;
  credibility?: Credibility;
  url?: string;
};

export type CreateSourceParams = {
  name: string;
  url: string;
  displayName?: string;
  description?: string;
  credibility?: Credibility;
};

export type GetSourceByIdParams = {
  id: ID;
};

export type GetSourcesParams = PaginationRequest;
