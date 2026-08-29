import type { RouterOutputs } from "@basango/api/trpc/routers/_app";

export type ArticleOverview = RouterOutputs["feed"]["articles"]["list"]["items"][number];
export type ArticleDetails = RouterOutputs["feed"]["articles"]["get"];
export type Bookmark = RouterOutputs["feed"]["bookmarks"]["list"]["items"][number];
export type Category = RouterOutputs["feed"]["categories"]["list"][number];
export type Comment = RouterOutputs["feed"]["comments"]["list"]["items"][number];
export type Source = RouterOutputs["feed"]["sources"]["list"]["items"][number];
