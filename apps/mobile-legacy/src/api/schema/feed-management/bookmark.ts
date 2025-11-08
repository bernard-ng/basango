import Joi from "joi";

import { ArticleOverview } from "@/api/schema/feed-management/article";

export type BookmarkPayload = {
  name: string;
  description?: string;
  isPublic: boolean;
};

export type Bookmark = {
  id: string;
  name: string;
  createdAt: string;
  description?: string;
  articlesCount: number;
  isPublic: boolean;
  updatedAt?: string;
};

export type BookmarkedArticle = ArticleOverview;

export const BookmarkPayloadSchema = Joi.object({
  description: Joi.string().optional(),
  isPublic: Joi.boolean().optional(),
  name: Joi.string().required().messages({
    "any.required": "Le nom est requis",
    "string.empty": "Le nom est requis",
  }),
});
