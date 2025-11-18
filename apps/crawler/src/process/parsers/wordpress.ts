import type { PageRange, TimestampRange, WordPressSourceConfig } from "@basango/domain/crawler";
import { Article } from "@basango/domain/models";
import { logger } from "@basango/logger";
import { fromUnixTime } from "date-fns";
import TurndownService from "turndown";

import { FetchCrawlerConfig } from "#crawler/config";
import {
  ArticleOutOfDateRangeError,
  InvalidArticleError,
  UnsupportedSourceKindError,
} from "#crawler/errors";
import { BaseCrawler } from "#crawler/process/parsers/base";
import { Persistor, persist } from "#crawler/process/persistence";
import { isTimestampInRange } from "#crawler/utils";

const md = new TurndownService({
  bulletListMarker: "-",
  headingStyle: "atx",
  hr: "---",
});

interface WordPressPost {
  link?: string;
  slug?: string;
  title?: { rendered?: string };
  content?: { rendered?: string };
  date?: string;
  categories?: number[];
}

/**
 * Crawler for WordPress sites using the REST API.
 */
export class WordPressCrawler extends BaseCrawler {
  readonly source: WordPressSourceConfig;
  private categoryMap: Map<number, string> = new Map();

  public static readonly POST_QUERY =
    "_fields=date,slug,link,title.rendered,content.rendered,categories&orderby=date&order=desc";
  public static readonly CATEGORY_QUERY =
    "_fields=id,slug,count&orderby=count&order=desc&per_page=100";
  public static readonly TOTAL_PAGES_HEADER = "x-wp-totalpages";
  public static readonly TOTAL_POSTS_HEADER = "x-wp-total";

  constructor(settings: FetchCrawlerConfig, options: { persistors?: Persistor[] } = {}) {
    super(settings, options);

    if (!settings.source || settings.source.sourceKind !== "wordpress") {
      throw new UnsupportedSourceKindError(
        "WordPressCrawler requires a source of kind 'wordpress'",
      );
    }
    this.source = this.settings.source as WordPressSourceConfig;
  }

  /**
   * Fetch and process WordPress posts.
   */
  async fetch(): Promise<void> {
    const pageRange = this.settings.pageRange ?? (await this.getPagination());
    const dateRange = this.settings.dateRange;

    for (let page = pageRange.start; page <= pageRange.end; page += 1) {
      const endpoint = this.buildEndpointUrl(page);

      try {
        const response = await this.http.get(endpoint);
        const articles = (await response.json()) as WordPressPost[];

        for (const node of articles) {
          try {
            await this.fetchOne(node, dateRange);
          } catch (error: unknown) {
            if (error instanceof ArticleOutOfDateRangeError) {
              logger.info(
                { url: node.link },
                "Article out of date range, stopping further processing",
              );
              break;
            }

            logger.error({ error, url: node.link }, "Failed to process WordPress article");
          }
        }
      } catch (error) {
        logger.error({ error, page }, `Failed to fetch WordPress page ${page}`);
      }
    }
  }

  /**
   * Fetch links from a WordPress posts endpoint.
   * @param url - The posts endpoint URL
   */
  async fetchLinks(url: string) {
    const response = await this.http.get(url);
    const data = (await response.json()) as unknown;
    const articles = Array.isArray(data) ? (data as WordPressPost[]) : [];
    if (!Array.isArray(data)) {
      logger.warn({ type: typeof data }, "Unexpected WordPress payload type");
    }
    return articles;
  }

  /**
   * Fetch and process a single WordPress post.
   * @param input - Decoded JSON object or raw JSON string
   * @param dateRange - Optional date range for filtering
   */
  async fetchOne(input: unknown, dateRange?: TimestampRange | null): Promise<Article> {
    // input can be the decoded JSON object or a raw JSON string
    let data: WordPressPost | null = null;
    try {
      if (typeof input === "string") {
        data = JSON.parse(input) as WordPressPost;
      } else if (input && typeof input === "object") {
        data = input as WordPressPost;
      }
    } catch (error) {
      logger.error({ error }, "Failed to decode WordPress payload");
      throw error;
    }

    if (!data || typeof data !== "object") {
      throw new InvalidArticleError("Unexpected WordPress payload type");
    }

    const link = data.link;
    if (!link) {
      throw new InvalidArticleError("Missing article link");
    }

    const title =
      this.textContent(this.parseHtml(data.title?.rendered ?? "")) ?? data.slug ?? "Untitled";
    const body = md.turndown(data.content?.rendered ?? "");
    const timestamp = this.computeTimestamp(data.date);
    const categories = await this.mapCategories(data.categories ?? []);

    if (dateRange && !isTimestampInRange(dateRange, timestamp)) {
      throw new ArticleOutOfDateRangeError("Article outside date range", {
        link,
        timestamp,
        title,
      });
    }

    const article = await this.enrichWithOpenGraph(
      {
        body,
        categories,
        link,
        publishedAt: fromUnixTime(timestamp),
        sourceId: this.source.sourceId,
        title,
      },
      link,
    );

    return await persist(article, this.persistors);
  }

  /**
   * Get pagination info from WordPress API.
   */
  async getPagination(): Promise<PageRange> {
    try {
      const url = `${this.baseUrl()}wp-json/wp/v2/posts?_fields=id&per_page=100`;
      const response = await this.http.get(url);
      const pages = Number.parseInt(
        response.headers.get(WordPressCrawler.TOTAL_PAGES_HEADER) ?? "1",
        10,
      );
      const posts = Number.parseInt(
        response.headers.get(WordPressCrawler.TOTAL_POSTS_HEADER) ?? "0",
        10,
      );
      logger.info({ pages, posts }, "WordPress pagination");
      const end = Number.isFinite(pages) && pages > 0 ? pages : 1;
      return { end, start: 1 };
    } catch {
      return { end: 1, start: 1 };
    }
  }

  /**
   * Get base URL for WordPress REST API.
   */
  private baseUrl(): string {
    const base = String(this.source.sourceUrl);
    return base.endsWith("/") ? base : `${base}/`;
  }

  /**
   * Construct posts endpoint URL for a given page.
   * @param page - Page number
   */
  buildEndpointUrl(page: number): string {
    return `${this.baseUrl()}wp-json/wp/v2/posts?${
      WordPressCrawler.POST_QUERY
    }&page=${page}&per_page=100`;
  }

  /**
   * Fetch and cache WordPress categories.
   */
  private async fetchCategories(): Promise<void> {
    const url = `${this.baseUrl()}wp-json/wp/v2/categories?${WordPressCrawler.CATEGORY_QUERY}`;
    const response = await this.http.get(url);
    const list = (await response.json()) as Array<{ id: number; slug: string }>;
    for (const c of list) {
      this.categoryMap.set(c.id, c.slug);
    }
  }

  /**
   * Map category IDs to slugs.
   * @param ids - Category IDs
   */
  private async mapCategories(ids: number[]): Promise<string[]> {
    if (this.categoryMap.size === 0) {
      try {
        await this.fetchCategories();
      } catch (error) {
        logger.warn({ error }, "Failed to fetch WordPress categories");
      }
    }
    const values: string[] = [];
    for (const id of [...ids].sort((a, b) => a - b)) {
      const slug = this.categoryMap.get(id);
      if (slug && !values.includes(slug)) values.push(slug);
    }
    return values;
  }

  /**
   * Compute UNIX timestamp from WordPress date string.
   * @param raw - Raw date string
   */
  private computeTimestamp(raw?: string | null): number {
    if (!raw) return Math.floor(Date.now() / 1000);
    // Normalize WordPress Z into +00:00 for Date parsing robustness
    const cleaned = raw.replace("Z", "+00:00");
    const parsed = Date.parse(cleaned);
    if (!Number.isNaN(parsed)) return Math.floor(parsed / 1000);
    return Math.floor(Date.now() / 1000);
  }
}
