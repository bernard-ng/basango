import { AnySourceOptions, CrawlerFetchingOptions, config } from "@basango/domain/config";
import { Article } from "@basango/domain/models";
import { HTMLElement, parse as parseHtml } from "node-html-parser";

import type { ArticleOutbox } from "#crawler/articles/article-outbox";
import { SyncHttpClient } from "#crawler/http/http-client";
import { OpenGraph } from "#crawler/http/open-graph";

export interface CrawlerOptions {
  articleOutbox?: ArticleOutbox;
}

export abstract class BaseCrawler {
  protected readonly options: CrawlerFetchingOptions;
  protected readonly source: AnySourceOptions;
  protected readonly http: SyncHttpClient;
  protected readonly articleOutbox: ArticleOutbox | undefined;
  protected readonly openGraph: OpenGraph;

  protected constructor(options: CrawlerFetchingOptions, crawlerOptions: CrawlerOptions = {}) {
    if (!options.source) {
      throw new Error("Crawler requires a bound source");
    }

    this.http = new SyncHttpClient(config.crawler.fetch.client);
    this.articleOutbox = crawlerOptions.articleOutbox;
    this.openGraph = new OpenGraph();

    this.options = options;
    this.source = options.source as AnySourceOptions;
  }

  protected requireArticleOutbox(): ArticleOutbox {
    if (!this.articleOutbox) {
      throw new Error("Article ingestion requires a SQLite article outbox");
    }

    return this.articleOutbox;
  }

  /**
   * Fetch and process articles from the source.
   */
  abstract fetch(): Promise<void> | void;

  /**
   * Crawl the given URL and return the HTML content as a string.
   * @param url - The URL to crawl
   */
  async crawl(url: string): Promise<string> {
    const response = await this.http.get(url);
    return await response.text();
  }

  /**
   * Extract text content from an HTML node.
   * @param node - The HTML node
   */
  protected textContent(node: HTMLElement | null | undefined): string | null {
    if (!node) return null;
    // innerText keeps spacing similar to browser rendering
    const value = node.innerText ?? node.text;
    const text = value.trim();
    return text.length ? text : null;
  }

  /**
   * Extract the first matching element from the root using the selector.
   * @param root - The root HTML element
   * @param selector - The CSS selector
   */
  protected extractFirst(root: HTMLElement, selector?: string | null): HTMLElement | null {
    if (!selector) return null;
    try {
      return root.querySelector(selector) ?? null;
    } catch {
      return null;
    }
  }

  /**
   * Extract all matching elements from the root using the selector.
   * @param root - The root HTML element
   * @param selector - The CSS selector
   */
  protected extractAll(root: HTMLElement, selector?: string | null): HTMLElement[] {
    if (!selector) return [];
    try {
      return root.querySelectorAll(selector);
    } catch {
      return [];
    }
  }

  /**
   * Parse HTML string into an HTMLElement.
   * @param html - The HTML string
   */
  protected parseHtml(html: string): HTMLElement {
    return parseHtml(html) as unknown as HTMLElement;
  }

  /**
   * Enrich the record with Open Graph metadata from the given URL.
   * @param record - The article record
   * @param url - The URL to fetch Open Graph data from
   * @param html - Optional existing HTML to avoid fetching the same page twice
   */
  protected async enrichWithOpenGraph(
    record: Partial<Article>,
    url?: string,
    html?: string,
  ): Promise<Partial<Article>> {
    try {
      const metadata = url
        ? html
          ? OpenGraph.consumeHtml(html, url)
          : await this.openGraph.consumeUrl(url)
        : undefined;
      return { ...record, metadata };
    } catch {
      return { ...record, metadata: undefined };
    }
  }
}
