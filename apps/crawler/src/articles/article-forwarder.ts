import { config } from "@basango/domain/config";
import type { Article } from "@basango/domain/models";
import { logger } from "@basango/logger";

import { HttpError, SyncHttpClient } from "#crawler/http/http-client";

export interface ForwardResult {
  ok: boolean;
  retryable: boolean;
  status?: number;
  message?: string;
}

const isRetryableStatus = (status: number): boolean => {
  return status === 408 || status === 425 || status === 429 || status >= 500;
};

const stringifyResponseBody = (data: unknown): string | undefined => {
  if (!data) return undefined;
  if (typeof data === "string") return data;

  try {
    return JSON.stringify(data);
  } catch {
    return undefined;
  }
};

export class ArticleForwarder {
  private readonly client: SyncHttpClient;
  private readonly endpoint: string;
  private readonly token: string;

  constructor() {
    this.client = new SyncHttpClient(config.crawler.fetch.client);
    this.endpoint = config.crawler.backend.endpoint;
    this.token = config.crawler.backend.token;
  }

  async forward(payload: Partial<Article>): Promise<ForwardResult> {
    try {
      const response = await this.client.post(`${this.endpoint}/articles`, {
        headers: {
          Authorization: this.token,
          ...(payload.hash ? { "Idempotency-Key": payload.hash } : {}),
        },
        json: payload,
      });

      if (response.ok) {
        const data = await response.json();
        logger.info({ ...data }, "Article forwarded");
        return { ok: true, retryable: false, status: response.status };
      }

      logger.error({ status: response.status, url: payload.link }, "Forwarding failed");
      return {
        message: `Forwarding failed with HTTP ${response.status}`,
        ok: false,
        retryable: isRetryableStatus(response.status),
        status: response.status,
      };
    } catch (error) {
      if (error instanceof HttpError) {
        const data = await error.response.json().catch(() => ({}));
        logger.error({ ...data, url: payload.link }, "Error forwarding article");
        const body = stringifyResponseBody(data);
        return {
          message: body
            ? `Forwarding failed with HTTP ${error.status}: ${body}`
            : `Forwarding failed with HTTP ${error.status}`,
          ok: false,
          retryable: isRetryableStatus(error.status),
          status: error.status,
        };
      }

      logger.error({ err: error, url: payload.link }, "Error forwarding article");
      return {
        message: error instanceof Error ? error.message : "Error forwarding article",
        ok: false,
        retryable: true,
      };
    }
  }
}
