import { CrawlerFetchingOptions, HtmlSourceOptions } from "@basango/domain/config";
import { Article, TimestampRange } from "@basango/domain/models";
import { logger } from "@basango/logger";
import { fromUnixTime, getUnixTime, isMatch as isDateMatch, parse } from "date-fns";
import { HTMLElement } from "node-html-parser";
import TurndownService from "turndown";

import type { ArticleOutbox } from "#crawler/articles/article-outbox";
import { ingestArticle } from "#crawler/articles/ingest-article";
import { createAbsoluteUrl, isTimestampInRange } from "#crawler/config/ranges";
import {
  ArticleOutOfDateRangeError,
  InvalidArticleError,
  InvalidSourceSelectorsError,
  UnsupportedSourceKindError,
} from "#crawler/errors";
import { BaseCrawler } from "#crawler/sources/base-crawler";
import { buildHtmlEndpointUrl, resolveHtmlPagination } from "#crawler/sources/html/html-pagination";

const md = new TurndownService({
  bulletListMarker: "-",
  headingStyle: "atx",
  hr: "---",
});

/**
 * Crawler for generic HTML pages.
 */
export class HtmlCrawler extends BaseCrawler {
  readonly source: HtmlSourceOptions;
  private currentNode: string | null = null;

  constructor(settings: CrawlerFetchingOptions, options: { articleOutbox?: ArticleOutbox } = {}) {
    super(settings, options);

    if (!settings.source || settings.source.sourceKind !== "html") {
      throw new UnsupportedSourceKindError("HtmlCrawler requires a source of kind 'html'");
    }
    this.source = this.options.source as HtmlSourceOptions;
  }

  async fetch(): Promise<void> {
    const pageRange = this.options.pageRange ?? (await this.getPagination());
    const dateRange = this.options.dateRange;
    const selectors = this.source.sourceSelectors;

    if (!selectors.articles) {
      throw new InvalidSourceSelectorsError("No article selector configured for HTML source");
    }

    for (let page = pageRange.start; page <= pageRange.end; page += 1) {
      const endpoint = this.buildEndpointUrl(page);
      let html: string;

      try {
        html = await this.crawl(endpoint);
      } catch (error) {
        logger.error({ endpoint, error, page }, `Failed to crawl page ${page}`);
        continue;
      }

      const root = this.parseHtml(html);
      const articles = this.extractAll(root, selectors.articles);
      if (!articles.length) {
        logger.error({ page }, "No articles found on page");
        continue;
      }

      for (const node of articles) {
        try {
          this.currentNode = this.extractLink(node);
          let nodeHtml = node.toString();

          if (this.source.requiresDetails) {
            if (!this.currentNode) {
              logger.error({ page }, "Skipping article without link for details");
              continue;
            }

            try {
              nodeHtml = await this.crawl(this.currentNode);
            } catch (error) {
              logger.error({ error, url: this.currentNode }, "Failed to fetch detail page");
              continue;
            }
          }

          await this.fetchOne(nodeHtml, dateRange, this.currentNode ?? undefined);
        } catch (error: unknown) {
          if (error instanceof ArticleOutOfDateRangeError) {
            logger.info(
              { url: this.currentNode },
              "Article out of date range, stopping further processing",
            );
            return;
          }

          logger.error({ error, url: this.currentNode }, "Failed to process HTML article");
        } finally {
          this.currentNode = null;
        }
      }
    }
  }

  /**
   * Fetch and process a single HTML article.
   * @param html - The HTML content of the article
   * @param dateRange - Optional date range for filtering
   * @param articleUrl - Optional known article URL, useful when parsing detail pages
   */
  async fetchOne(
    html: string,
    dateRange?: TimestampRange | null,
    articleUrl?: string,
  ): Promise<Partial<Article>> {
    const root = this.parseHtml(html);
    const selectors = this.source.sourceSelectors;

    const title = this.extractText(root, selectors.articleTitle);
    const link = articleUrl ?? this.currentNode ?? this.extractLink(root);
    if (!link || !title) {
      throw new InvalidArticleError("Missing article link or title");
    }

    const body = this.extractBody(root, selectors.articleBody);
    const categories = this.extractCategories(root, selectors.articleCategories);
    const date = this.extractText(root, selectors.articleDate);
    const timestamp = this.computeTimestamp(date);
    if (timestamp === null) {
      throw new InvalidArticleError("Missing or invalid article date");
    }

    if (dateRange && !isTimestampInRange(dateRange, timestamp)) {
      throw new ArticleOutOfDateRangeError("Article outside date range", {
        date,
        link,
        timestamp,
        title,
      });
    }

    const data = await this.enrichWithOpenGraph(
      {
        body,
        categories,
        link,
        publishedAt: fromUnixTime(timestamp),
        sourceId: this.source.sourceId,
        title,
      },
      link,
      html,
    );

    return await ingestArticle(data, { articleOutbox: this.requireArticleOutbox() });
  }

  /**
   * Fetch links from the target URL using the given selector.
   * @param target - The target URL to crawl
   * @param selector - The CSS selector to extract links
   */
  async fetchLinks(target: string, selector: string) {
    const html = await this.crawl(target);
    const root = this.parseHtml(html);
    return this.extractAll(root, selector);
  }

  /**
   * Get the pagination range (start and end page numbers).
   */
  async getPagination(): Promise<{ start: number; end: number }> {
    return await resolveHtmlPagination({
      category: this.options.category,
      crawl: (url) => this.crawl(url),
      extractAll: (root, selector) => this.extractAll(root, selector),
      parseHtml: (html) => this.parseHtml(html),
      source: this.source,
    });
  }

  /**
   * Build the URL for a given page number.
   * @param page - The page number
   */
  buildEndpointUrl(page: number): string {
    return buildHtmlEndpointUrl({
      category: this.options.category,
      page,
      source: this.source,
    });
  }

  /**
   * Extract link URL from the given node using the selector.
   * @param node - The HTML element
   */
  extractLink(node: HTMLElement): string | null {
    const selector = this.source.sourceSelectors.articleLink;
    if (!selector) return null;
    const target = this.extractFirst(node, selector);
    if (!target) return null;

    const href =
      target.getAttribute("href") ?? target.getAttribute("data-href") ?? target.getAttribute("src");

    if (!href) return null;
    return createAbsoluteUrl(this.source.sourceUrl, href);
  }

  /**
   * Extract text content from the root using the selector.
   * @param root - The root HTML element
   * @param selector - The CSS selector
   */
  private extractText(root: HTMLElement, selector?: string | null): string | null {
    if (!selector) return null;
    const target = this.extractFirst(root, selector);
    if (!target) return null;

    // If it's an image, prefer alt/title
    const tag = target.tagName.toLowerCase();
    if (tag === "img") {
      const alt = target.getAttribute("alt");
      const title = target.getAttribute("title");
      const pick = (alt ?? title ?? "").trim();
      if (pick.length > 0) return pick;
    }

    // If it's a time tag, prefer datetime attribute
    if (tag === "time") {
      const datetime = target.getAttribute("datetime");
      if (datetime) return datetime.trim();
    }

    // If it's a meta tag, prefer content attribute
    if (tag === "meta") {
      const content = target.getAttribute("content");
      if (content) return content.trim();
    }

    return this.textContent(target);
  }

  /**
   * Extract body content from the root using the selector.
   * @param root - The root HTML element
   * @param selector - The CSS selector
   */
  private extractBody(root: HTMLElement, selector?: string | null): string {
    if (selector) {
      const nodes = this.extractAll(root, selector);
      if (nodes.length) {
        const parts = nodes.map((n) => md.turndown(n.toString())).filter(Boolean);
        if (parts.length) return parts.join("\n");
      }
    }
    return md.turndown(root.toString());
  }

  /**
   * Extract categories from the root using the selector.
   * @param root - The root HTML element
   * @param selector - The CSS selector
   */
  private extractCategories(root: HTMLElement, selector?: string | null): string[] {
    if (!selector && this.options.category) return [this.options.category.toLowerCase()];
    if (!selector) return [];

    const values: string[] = [];
    for (const node of this.extractAll(root, selector)) {
      const text = this.textContent(node);
      if (!text) continue;
      const lower = text.toLowerCase();
      if (!values.includes(lower)) values.push(lower);
    }
    return values;
  }

  /**
   * Compute Unix timestamp from raw date string.
   * @param raw - Raw date string
   * @private
   */
  private computeTimestamp(raw?: string | null): number | null {
    if (!raw) return null;
    const value = raw.trim();
    if (!value) return null;

    const format = this.source.sourceDate.format;
    if (format === "dd.MM.yyyy") {
      const [day, month, year] = value.split(".").map(Number);
      if (!day || !month || !year) return null;
      const timestamp = getUnixTime(new Date(year!, month! - 1, day));
      return Number.isFinite(timestamp) ? timestamp : null;
    }

    if (!isDateMatch(value, format)) {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
    }

    const date = parse(value, format, new Date());
    const timestamp = getUnixTime(date);
    return Number.isFinite(timestamp) ? timestamp : null;
  }
}
