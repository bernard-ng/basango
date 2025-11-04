import { logger } from "@basango/logger";
import { HTMLElement } from "node-html-parser";
import { getUnixTime, isMatch as isDateMatch, parse as parseDateFns } from "date-fns";

import { isTimestampInRange, createAbsoluteUrl } from "@/utils";
import { persist, Persistor } from "@/process/persistence";
import { BaseCrawler } from "@/process/parsers/base";
import TurndownService from "turndown";
import { DateRange, HtmlSourceConfig } from "@/schema";
import { FetchCrawlerConfig } from "@/config";

const md = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
});

/**
 * Create a safe RegExp from the given pattern.
 * @param pattern
 */
const safeRegExp = (pattern?: string | null): RegExp | null => {
  if (!pattern) return null;
  try {
    return new RegExp(pattern, "g");
  } catch {
    return null;
  }
};

/**
 * Crawler for generic HTML pages.
 */
export class HtmlCrawler extends BaseCrawler {
  readonly source: HtmlSourceConfig;
  private currentArticleUrl: string | null = null;

  constructor(settings: FetchCrawlerConfig, options: { persistors?: Persistor[] } = {}) {
    super(settings, options);

    if (!settings.source || settings.source.sourceKind !== "html") {
      throw new Error("HtmlCrawler requires a source of kind 'html'");
    }
    this.source = this.settings.source as HtmlSourceConfig;
  }

  async fetch(): Promise<void> {
    const pageRange = this.settings.pageRange ?? (await this.getPagination());
    const dateRange = this.settings.dateRange;

    const articleSelector = this.source.sourceSelectors.articles;
    if (!articleSelector) {
      logger.error(
        { source: this.source.sourceId },
        "No article selector configured for HTML source",
      );
      return;
    }

    let stop = false;
    for (let page = pageRange.start; page <= pageRange.end; page += 1) {
      const pageUrl = this.buildPageUrl(page);
      let html: string;
      try {
        html = await this.crawl(pageUrl);
      } catch (error) {
        logger.error({ error, page, pageUrl }, "> page %s => [failed]", page);
        continue;
      }

      const root = this.parseHtml(html);
      const articles = this.extractAll(root, articleSelector);
      if (!articles.length) {
        logger.info({ page }, "No articles found on page");
        continue;
      }

      for (const node of articles) {
        try {
          this.currentArticleUrl = this.extractLink(node);
          let targetHtml = node.toString();

          if (this.source.requiresDetails) {
            if (!this.currentArticleUrl) {
              logger.debug({ page }, "Skipping article without link for details");
              continue;
            }
            try {
              targetHtml = await this.crawl(this.currentArticleUrl);
            } catch (err) {
              logger.error(
                { error: err, url: this.currentArticleUrl },
                "Failed to fetch detail page",
              );
              continue;
            }
          }

          const saved = await this.fetchOne(targetHtml, dateRange);
          // stop early on first out-of-range if pages are sorted by date desc
          if (saved === null) {
            stop = true;
            break;
          }
        } catch (error) {
          logger.error({ error, pageUrl }, "Failed to process article on page");
        } finally {
          this.currentArticleUrl = null;
        }
      }

      if (stop) break;
    }
  }

  /**
   * Fetch and process a single HTML article.
   * @param html - The HTML content of the article
   * @param dateRange - Optional date range for filtering
   */
  async fetchOne(html: string, dateRange?: DateRange | null) {
    const root = this.parseHtml(html);
    const sel = this.source.sourceSelectors;

    const titleText = this.extractText(root, sel.articleTitle) ?? "Untitled";
    const link = this.currentArticleUrl ?? this.extractLink(root);
    if (!link) {
      logger.warn({ title: titleText }, "Skipping article without link");
      return null;
    }

    const body = this.extractBody(root, sel.articleBody);
    const categories = this.extractCategories(root, sel.articleCategories);
    const rawDate = this.extractText(root, sel.articleDate);
    const timestamp = this.computeTimestamp(rawDate);

    if (dateRange && !isTimestampInRange(dateRange, timestamp)) {
      logger.info(
        { title: titleText, link, date: rawDate, timestamp },
        "Skipping article outside date range",
      );
      return null;
    }

    const enriched = await this.enrichWithOpenGraph(
      {
        title: titleText,
        link,
        body,
        categories,
        source: this.source.sourceId,
        timestamp,
      },
      link,
    );

    return await persist(enriched, this.persistors);
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
    return { start: 0, end: await this.getLastPage() };
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
      const href = (last as any).getAttribute?.("href") as string | null;
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
  buildPageUrl(page: number): string {
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
      (target.getAttribute?.("href") as string | null) ??
      ((target as any).getAttribute?.("data-href") as string | null) ??
      ((target as any).getAttribute?.("src") as string | null);
    if (!href) return null;
    const absolute = createAbsoluteUrl(this.source.sourceUrl, href);
    return absolute;
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
    const tag = (target as any).tagName?.toLowerCase?.() as string | undefined;
    if (tag === "img") {
      const alt = (target as any).getAttribute?.("alt") as string | null;
      const title = (target as any).getAttribute?.("title") as string | null;
      const pick = (alt ?? title ?? "").trim();
      if (pick.length > 0) return pick;
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
    let value = raw.trim();
    const pattern = safeRegExp(this.source.sourceDate?.pattern);
    const replacement = this.source.sourceDate?.replacement ?? "";
    if (pattern) {
      try {
        value = value.replace(pattern, replacement);
      } catch {
        // ignore pattern failures
      }
    }
    const format = this.source.sourceDate?.format ?? "yyyy-LL-dd HH:mm";
    if (!isDateMatch(value, format)) {
      // fallback: try native Date.parse as last resort
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? Math.floor(Date.now() / 1000) : Math.floor(parsed / 1000);
    }
    const date = parseDateFns(value, format, new Date());
    const ts = getUnixTime(date);
    return Number.isFinite(ts) ? ts : Math.floor(Date.now() / 1000);
  }
}
