import type { HtmlSourceOptions } from "@basango/domain/config";
import type { PageRange } from "@basango/domain/models";
import type { HTMLElement } from "node-html-parser";

import { createAbsoluteUrl } from "#crawler/config/ranges";

export const buildHtmlEndpointUrl = (settings: {
  category?: string;
  page: number;
  source: HtmlSourceOptions;
}): string => {
  let template = settings.source.paginationTemplate;
  if (template.includes("{category}")) {
    template = template.replace("{category}", settings.category ?? "");
  }

  if (template.includes("{page}")) {
    template = template.replace("{page}", String(settings.page));
  } else if (settings.page > 0) {
    const sep = template.includes("?") ? "&" : "?";
    template = `${template}${sep}page=${settings.page}`;
  }

  return createAbsoluteUrl(settings.source.sourceUrl, template);
};

export const resolveHtmlPagination = async (settings: {
  category?: string;
  crawl: (url: string) => Promise<string>;
  extractAll: (root: HTMLElement, selector?: string | null) => HTMLElement[];
  parseHtml: (html: string) => HTMLElement;
  source: HtmlSourceOptions;
}): Promise<PageRange> => {
  const url = buildHtmlEndpointUrl({
    category: settings.category,
    page: 0,
    source: settings.source,
  });

  try {
    const html = await settings.crawl(url);
    const root = settings.parseHtml(html);
    const links = settings.extractAll(root, settings.source.sourceSelectors.pagination);
    if (!links.length) return { end: 1, start: 0 };

    const last = links[links.length - 1]!;
    const href = last.getAttribute("href") as string | null;
    if (!href) return { end: 1, start: 0 };

    const numberMatch = href.match(/(\d+)/);
    if (numberMatch) {
      const page = Number.parseInt(numberMatch[1]!, 10);
      return { end: Number.isFinite(page) && page > 0 ? page : 1, start: 0 };
    }

    const urlObj = new URL(createAbsoluteUrl(settings.source.sourceUrl, href));
    const pageParam = urlObj.searchParams.get("page");
    if (pageParam) {
      const page = Number.parseInt(pageParam, 10);
      return { end: Number.isFinite(page) && page > 0 ? page : 1, start: 0 };
    }

    return { end: 1, start: 0 };
  } catch {
    return { end: 1, start: 0 };
  }
};
