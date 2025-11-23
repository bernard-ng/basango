import { config } from "@basango/domain/config";
import { DEFAULT_OPEN_GRAPH_USER_AGENT } from "@basango/domain/constants";
import { ArticleMetadata } from "@basango/domain/models";
import { parse } from "node-html-parser";

import { SyncHttpClient } from "#crawler/http/http-client";
import { UserAgents } from "#crawler/http/user-agent";
import { createAbsoluteUrl } from "#crawler/utils";

/**
 * Picks the first non-empty value from the provided array.
 * @param values - An array of string values
 */
const pick = (values: Array<string | null | undefined>): string | undefined => {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return undefined;
};

/**
 * Extracts the content of a meta tag given its property or name.
 * @param root - The root HTML element
 * @param property - The property or name of the meta tag to extract
 */
const extract = (root: ReturnType<typeof parse>, property: string): string | null => {
  const selector = `meta[property='${property}'], meta[name='${property}']`;
  const node = root.querySelector(selector);
  if (!node) {
    return null;
  }
  return node.getAttribute("content") ?? null;
};

/**
 * OpenGraph consumer for extracting Open Graph metadata from HTML pages.
 * Uses a synchronous HTTP client to fetch the HTML content.
 *
 * @author Bernard Ngandu <bernard@devscast.tech>
 */
export class OpenGraph {
  private readonly client: Pick<SyncHttpClient, "get">;

  constructor() {
    const settings = config.crawler.fetch.client;
    const provider = new UserAgents(true, DEFAULT_OPEN_GRAPH_USER_AGENT);

    this.client = new SyncHttpClient(settings, {
      defaultHeaders: { "User-Agent": provider.og() },
      userAgentProvider: provider,
    });
  }

  /**
   * Consume a URL and extract Open Graph metadata.
   * @param url - The URL to fetch and parse
   */
  async consumeUrl(url: string): Promise<ArticleMetadata | undefined> {
    try {
      const response = await this.client.get(url);
      const html = await response.text();
      return OpenGraph.consumeHtml(html, url);
    } catch {
      return undefined;
    }
  }

  /**
   * Consume HTML content and extract Open Graph metadata.
   * @param html - HTML content as a string
   * @param url - Optional URL of the page
   */
  static consumeHtml(html: string, url: string): ArticleMetadata | undefined {
    if (!html) {
      return undefined;
    }

    const root = parse(html);
    const title = pick([extract(root, "og:title"), root.querySelector("title")?.text]);
    const description = pick([extract(root, "og:description"), extract(root, "description")]);
    const image = pick([
      extract(root, "og:image"),
      root.querySelector("img")?.getAttribute("src") ?? null,
    ]);
    const canonical = pick([
      extract(root, "og:url"),
      root.querySelector("link[rel='canonical']")?.getAttribute("href") ?? null,
      url ?? null,
    ]);
    const author = pick([extract(root, "article:author"), extract(root, "og:article:author")]);
    const publishedAt = pick([
      extract(root, "article:published_time"),
      extract(root, "og:article:published_time"),
    ]);
    const updatedAt = pick([
      extract(root, "article:modified_time"),
      extract(root, "og:article:modified_time"),
    ]);

    if (!title && !description && !image && !canonical) {
      return undefined;
    }

    return {
      author,
      description,
      image: createAbsoluteUrl(url, image ?? "") || undefined,
      publishedAt,
      title,
      updatedAt,
      url: createAbsoluteUrl(url, canonical ?? "") || undefined,
    } as ArticleMetadata;
  }
}
