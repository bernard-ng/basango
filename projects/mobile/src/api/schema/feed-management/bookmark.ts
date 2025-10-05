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
    name: Joi.string().required().messages({
        "string.empty": "Le nom est requis",
        "any.required": "Le nom est requis",
    }),
    description: Joi.string().optional(),
    isPublic: Joi.boolean().optional(),
});
