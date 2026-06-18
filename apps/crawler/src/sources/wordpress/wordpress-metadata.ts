import type { WordPressSourceOptions } from "@basango/domain/config";
import type { ArticleMetadata } from "@basango/domain/models";

import { createAbsoluteUrl } from "#crawler/config/ranges";

export interface WordPressPost {
  categories?: number[];
  content?: { rendered?: string };
  date?: string;
  excerpt?: { rendered?: string };
  link?: string;
  slug?: string;
  title?: { rendered?: string };
  yoast_head_json?: YoastHeadJson;
}

interface YoastHeadJson {
  article_modified_time?: string;
  article_published_time?: string;
  author?: string;
  description?: string;
  og_description?: string;
  og_image?: Array<{ url?: string }>;
  og_title?: string;
  og_url?: string;
  title?: string;
}

const pick = (values: Array<string | null | undefined>): string | undefined => {
  for (const value of values) {
    const text = value?.trim();
    if (text) return text;
  }

  return undefined;
};

const hasMetadata = (metadata: ArticleMetadata): boolean => {
  return Boolean(metadata.title || metadata.description || metadata.image || metadata.url);
};

export const extractYoastMetadata = (post: WordPressPost): ArticleMetadata | undefined => {
  const yoast = post.yoast_head_json;
  if (!yoast) return undefined;

  const image = pick([yoast.og_image?.find((item) => item.url)?.url]);
  const url = pick([yoast.og_url, post.link]);
  const metadata = {
    author: pick([yoast.author]),
    description: pick([yoast.og_description, yoast.description]),
    image: image && post.link ? createAbsoluteUrl(post.link, image) : image,
    publishedAt: pick([yoast.article_published_time, post.date]),
    title: pick([yoast.og_title, yoast.title]),
    updatedAt: pick([yoast.article_modified_time]),
    url: url && post.link ? createAbsoluteUrl(post.link, url) : url,
  } satisfies ArticleMetadata;

  return hasMetadata(metadata) ? metadata : undefined;
};

export const extractRestMetadata = (
  post: WordPressPost,
  helpers: {
    textFromHtml: (html: string) => string | null;
  },
): ArticleMetadata | undefined => {
  const title = helpers.textFromHtml(post.title?.rendered ?? "");
  const description = helpers.textFromHtml(post.excerpt?.rendered ?? "");
  const metadata = {
    description: description ?? undefined,
    publishedAt: post.date,
    title: title ?? undefined,
    url: post.link,
  } satisfies ArticleMetadata;

  return hasMetadata(metadata) ? metadata : undefined;
};

export const shouldFetchWordPressMetadata = (
  strategy: WordPressSourceOptions["metadataStrategy"],
  metadata: ArticleMetadata | undefined,
): boolean => {
  return strategy === "fetch" || (strategy === "auto" && metadata === undefined);
};

export const extractWordPressMetadata = (
  post: WordPressPost,
  strategy: WordPressSourceOptions["metadataStrategy"],
  helpers: {
    textFromHtml: (html: string) => string | null;
  },
): ArticleMetadata | undefined => {
  switch (strategy) {
    case "none":
      return undefined;
    case "yoast":
      return extractYoastMetadata(post);
    case "rest":
      return extractRestMetadata(post, helpers);
    case "fetch":
      return undefined;
    case "auto":
      return extractYoastMetadata(post) ?? extractRestMetadata(post, helpers);
  }
};
