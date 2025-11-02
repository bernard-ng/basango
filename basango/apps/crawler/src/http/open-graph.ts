import { parse } from "node-html-parser";

import { OPEN_GRAPH_USER_AGENT } from "@/constants";
import type { ClientConfig } from "@/schema";
import { SyncHttpClient } from "@/http/http-client";
import { UserAgents } from "@/http/user-agent";

export interface OpenGraphMetadata {
  title?: string | null;
  description?: string | null;
  image?: string | null;
  url?: string | null;
}

export interface OpenGraphProviderOptions {
  client?: Pick<SyncHttpClient, "get">;
  clientConfig?: ClientConfig;
  userAgentProvider?: UserAgents;
}

const pick = (values: Array<string | null | undefined>): string | null => {
  for (const value of values) {
    if (value && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
};

const extractMeta = (root: ReturnType<typeof parse>, property: string): string | null => {
  const selector = `meta[property='${property}'], meta[name='${property}']`;
  const node = root.querySelector(selector);
  if (!node) {
    return null;
  }
  return node.getAttribute("content") ?? null;
};

export class OpenGraphProvider {
  private readonly client: Pick<SyncHttpClient, "get">;

  constructor(options: OpenGraphProviderOptions = {}) {
    const provider =
      options.userAgentProvider ?? new UserAgents(false, OPEN_GRAPH_USER_AGENT);
    const clientConfig: ClientConfig =
      options.clientConfig ?? ({
        timeout: 20,
        user_agent: OPEN_GRAPH_USER_AGENT,
        follow_redirects: true,
        verify_ssl: true,
        rotate: false,
        max_retries: 2,
        backoff_initial: 1,
        backoff_multiplier: 2,
        backoff_max: 5,
        respect_retry_after: true,
      } satisfies ClientConfig);

    this.client =
      options.client ??
      new SyncHttpClient(clientConfig, {
        userAgentProvider: provider,
        defaultHeaders: { "User-Agent": provider.og() },
      });
  }

  async consumeUrl(url: string): Promise<OpenGraphMetadata | null> {
    try {
      const response = await this.client.get(url);
      const html = await response.text();
      return OpenGraphProvider.consumeHtml(html, url);
    } catch {
      return null;
    }
  }

  static consumeHtml(html: string, url?: string): OpenGraphMetadata | null {
    if (!html) {
      return null;
    }

    const root = parse(html);
    const title = pick([
      extractMeta(root, "og:title"),
      root.querySelector("title")?.text,
    ]);
    const description = pick([
      extractMeta(root, "og:description"),
      extractMeta(root, "description"),
    ]);
    const image = pick([
      extractMeta(root, "og:image"),
      root.querySelector("img")?.getAttribute("src") ?? null,
    ]);
    const canonical = pick([
      extractMeta(root, "og:url"),
      root.querySelector("link[rel='canonical']")?.getAttribute("href") ?? null,
      url ?? null,
    ]);

    if (!title && !description && !image && !canonical) {
      return null;
    }

    return {
      title,
      description,
      image,
      url: canonical,
    };
  }
}
