import { logger } from "@basango/logger";
import { fromUnixTime, getUnixTime, isMatch as isDateMatch, parse } from "date-fns";
import { HTMLElement } from "node-html-parser";
import TurndownService from "turndown";

import { FetchCrawlerConfig } from "#crawler/config";
import {
  ArticleOutOfDateRangeError,
  InvalidArticleError,
  InvalidSourceSelectorsError,
  UnsupportedSourceKindError,
} from "#crawler/errors";
import { BaseCrawler } from "#crawler/process/parsers/base";
import { Persistor, persist } from "#crawler/process/persistence";
import { Article, DateRange, HtmlSourceConfig } from "#crawler/schema";
import { createAbsoluteUrl, isTimestampInRange } from "#crawler/utils";

const md = new TurndownService({
  bulletListMarker: "-",
  headingStyle: "atx",
  hr: "---",
});

/**
 * Crawler for generic HTML pages.
 */
export class HtmlCrawler extends BaseCrawler {
  readonly source: HtmlSourceConfig;
  private currentNode: string | null = null;

  constructor(settings: FetchCrawlerConfig, options: { persistors?: Persistor[] } = {}) {
    super(settings, options);

    if (!settings.source || settings.source.sourceKind !== "html") {
      throw new UnsupportedSourceKindError("HtmlCrawler requires a source of kind 'html'");
    }
    this.source = this.settings.source as HtmlSourceConfig;
  }

  async fetch(): Promise<void> {
    const pageRange = this.settings.pageRange ?? (await this.getPagination());
    const dateRange = this.settings.dateRange;
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

          await this.fetchOne(nodeHtml, dateRange);
        } catch (error: unknown) {
          if (error instanceof ArticleOutOfDateRangeError) {
            logger.info(
              { url: this.currentNode },
              "Article out of date range, stopping further processing",
            );
            break;
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
   */
  async fetchOne(html: string, dateRange?: DateRange | null): Promise<Article> {
    const root = this.parseHtml(html);
    const selectors = this.source.sourceSelectors;

    const title = this.extractText(root, selectors.articleTitle);
    const link = this.currentNode ?? this.extractLink(root);
    if (!link || !title) {
      throw new InvalidArticleError("Missing article link or title");
    }

    const body = this.extractBody(root, selectors.articleBody);
    const categories = this.extractCategories(root, selectors.articleCategories);
    const date = this.extractText(root, selectors.articleDate);
    const timestamp = this.computeTimestamp(date);

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
    );

    return await persist(data, this.persistors);
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
    return { end: await this.getLastPage(), start: 0 };
  }

  /**
   * Determine the last page number from pagination links.
   */
  private async getLastPage(): Promise<number> {
    const template = this.applyCategory(this.source.paginationTemplate);
    const url = `${this.source.sourceUrl}${template}`;
    try {
      const html = await this.crawl(url);
      const root = this.parseHtml(html);
      const links = this.extractAll(root, this.source.sourceSelectors.pagination);
      if (!links.length) return 1;
      const last = links[links.length - 1]!;
      const href = last.getAttribute("href") as string | null;
      if (!href) return 1;

      // Heuristic: prefer a number in the href, else "page" query param
      const numberMatch = href.match(/(\d+)/);
      if (numberMatch) {
        const page = Number.parseInt(numberMatch[1]!, 10);
        return Number.isFinite(page) && page > 0 ? page : 1;
      }
      const urlObj = new URL(createAbsoluteUrl(this.source.sourceUrl, href));
      const pageParam = urlObj.searchParams.get("page");
      if (pageParam) {
        const page = Number.parseInt(pageParam, 10);
        return Number.isFinite(page) && page > 0 ? page : 1;
      }
      return 1;
    } catch {
      return 1;
    }
  }

  /**
   * Build the URL for a given page number.
   * @param page - The page number
   */
  buildEndpointUrl(page: number): string {
    let template = this.applyCategory(this.source.paginationTemplate);
    if (template.includes("{page}")) {
      template = template.replace("{page}", String(page));
    } else if (page > 0) {
      const sep = template.includes("?") ? "&" : "?";
      template = `${template}${sep}page=${page}`;
    }
    return createAbsoluteUrl(this.source.sourceUrl, template);
  }

  /**
   * Apply category replacement in the template if needed.
   * @param template - The URL template
   */
  private applyCategory(template: string): string {
    if (template.includes("{category}")) {
      const replacement = this.settings.category ?? "";
      return template.replace("{category}", replacement);
    }
    return template;
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
    if (!selector && this.settings.category) return [this.settings.category.toLowerCase()];
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
  private computeTimestamp(raw?: string | null): number {
    if (!raw) return Math.floor(Date.now() / 1000);
    const value = raw.trim();

    const format = this.source.sourceDate.format;
    if (format === "dd.MM.yyyy") {
      const [day, month, year] = raw.split(".").map(Number);
      const timestamp = getUnixTime(new Date(year!, month! - 1, day));
      return Number.isFinite(timestamp) ? timestamp : Math.floor(Date.now() / 1000);
    }

    if (!isDateMatch(value, format)) {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? Math.floor(Date.now() / 1000) : Math.floor(parsed / 1000);
    }

    const date = parse(value, format, new Date());
    const timestamp = getUnixTime(date);
    return Number.isFinite(timestamp) ? timestamp : Math.floor(Date.now() / 1000);
  }
}
