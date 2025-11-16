import { Credibility, ID } from "@basango/domain/models";

export type UpdateSourceParams = {
  id: ID;
  name?: string;
  displayName?: string;
  description?: string;
  credibility?: Credibility;
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
