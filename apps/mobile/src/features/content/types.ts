import type { RouterOutputs } from "@basango/api/trpc/routers/_app";

export type ArticleOverview = RouterOutputs["public"]["articles"]["list"]["items"][number];
export type ArticleDetails = RouterOutputs["public"]["articles"]["get"];
export type Bookmark = RouterOutputs["public"]["bookmarks"]["list"]["items"][number];
export type Category = RouterOutputs["public"]["categories"]["list"][number];
export type Comment = RouterOutputs["public"]["comments"]["list"]["items"][number];
export type Source = RouterOutputs["public"]["sources"]["list"]["items"][number];
