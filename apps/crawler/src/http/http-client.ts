import { setTimeout as delay } from "node:timers/promises";

import { FetchClientConfig } from "#crawler/config";
import {
  DEFAULT_RETRY_AFTER_HEADER,
  DEFAULT_USER_AGENT,
  TRANSIENT_HTTP_STATUSES,
} from "#crawler/constants";
import { UserAgents } from "#crawler/http/user-agent";

export type HttpHeaders = Record<string, string>;
export type HttpParams = Record<string, string | number | boolean | null | undefined>;
export type HttpData = unknown;

export interface HttpClientOptions {
  userAgentProvider?: UserAgents;
  defaultHeaders?: HttpHeaders;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}

export interface HttpRequestOptions {
  headers?: HttpHeaders;
  params?: HttpParams;
  data?: HttpData;
  json?: HttpData;
  retryAfterHeader?: string;
}

export class HttpError extends Error {
  readonly status: number;
  readonly response: Response;

  constructor(message: string, response: Response) {
    super(message);
    this.status = response.status;
    this.response = response;
  }
}

/**
 * Default sleep function using setTimeout.
 * @param ms - Milliseconds to sleep
 */
const defaultSleep = (ms: number): Promise<void> => {
  return delay(ms).then(() => undefined);
};

/**
 * Builds a URL with query parameters.
 * @param url - The base URL
 * @param params - The query parameters to append
 */
const buildUrl = (url: string, params?: HttpParams): string => {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }

  const target = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    target.searchParams.set(key, String(value));
  }

  return target.toString();
};

/**
 * Computes the backoff time in milliseconds based on the configuration and attempt number.
 * @param config - Fetch client configuration
 * @param attempt - Current attempt number
 */
const computeBackoff = (config: FetchClientConfig, attempt: number): number => {
  const base = Math.min(
    config.backoffInitial * config.backoffMultiplier ** attempt,
    config.backoffMax,
  );
  const jitter = Math.random() * base * 0.25;
  return (base + jitter) * 1000;
};

const parseRetryAfter = (header: string): number => {
  const numeric = Number.parseInt(header, 10);
  if (!Number.isNaN(numeric)) {
    return Math.max(0, numeric * 1000);
  }

  const parsed = Date.parse(header);
  if (Number.isNaN(parsed)) {
    return 0;
  }

  const delta = parsed - Date.now();
  return delta > 0 ? delta : 0;
};

/**
 * Base HTTP client providing common functionality.
 *
 * @author Bernard Ngandu <bernard@devscast.tech>
 */
export class BaseHttpClient {
  protected readonly config: FetchClientConfig;
  protected readonly fetchImpl: typeof fetch;
  protected readonly sleep: (ms: number) => Promise<void>;
  protected readonly headers: HttpHeaders;

  constructor(config: FetchClientConfig, options: HttpClientOptions = {}) {
    this.config = config;
    const provider =
      options.userAgentProvider ??
      new UserAgents(config.rotate, config.userAgent ?? DEFAULT_USER_AGENT);
    const userAgent = provider.get() ?? config.userAgent ?? DEFAULT_USER_AGENT;

    const baseHeaders: HttpHeaders = { "User-Agent": userAgent };
    if (options.defaultHeaders) {
      Object.assign(baseHeaders, options.defaultHeaders);
    }

    this.headers = baseHeaders;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
  }

  protected buildHeaders(headers?: HttpHeaders): HeadersInit {
    return { ...this.headers, ...(headers ?? {}) };
  }

  protected async maybeDelay(
    attempt: number,
    response?: Response,
    retryAfterHeader: string = DEFAULT_RETRY_AFTER_HEADER,
  ): Promise<void> {
    let waitMs = 0;

    if (response) {
      const retryAfter = response.headers.get(retryAfterHeader);
      if (retryAfter && this.config.respectRetryAfter) {
        waitMs = parseRetryAfter(retryAfter);
      }
    }

    if (waitMs === 0) {
      waitMs = computeBackoff(this.config, attempt);
    }

    if (waitMs > 0) {
      await this.sleep(waitMs);
    }
  }
}

/**
 * Synchronous HTTP client with retry and timeout capabilities.
 *
 * @author Bernard Ngandu <bernard@devscast.tech>
 */
export class SyncHttpClient extends BaseHttpClient {
  async request(method: string, url: string, options: HttpRequestOptions = {}): Promise<Response> {
    const retryAfterHeader = options.retryAfterHeader ?? DEFAULT_RETRY_AFTER_HEADER;
    const target = buildUrl(url, options.params);

    const maxAttempts = this.config.maxRetries + 1;
    let attempt = 0;
    let lastError: unknown;

    while (attempt < maxAttempts) {
      const controller = new AbortController();
      let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
      try {
        timeoutHandle = setTimeout(() => controller.abort(), this.config.timeout * 1000);

        const headers = this.buildHeaders(options.headers);
        const init: RequestInit = {
          body: options.data as BodyInit | undefined,
          headers,
          method,
          redirect: this.config.followRedirects ? "follow" : "manual",
          signal: controller.signal,
        };

        if (options.json !== undefined) {
          init.body = JSON.stringify(options.json);
          (init.headers as Record<string, string>)["Content-Type"] ??= "application/json";
        }

        const response = await this.fetchImpl(target, init);

        if (
          TRANSIENT_HTTP_STATUSES.includes(response.status as number) &&
          attempt < this.config.maxRetries
        ) {
          await this.maybeDelay(attempt, response, retryAfterHeader);
          attempt += 1;
          continue;
        }

        if (!response.ok) {
          throw new HttpError(`HTTP ${response.status} ${response.statusText}`, response);
        }

        return response;
      } catch (error) {
        if (error instanceof HttpError) {
          lastError = error;
          throw error;
        }

        if (error instanceof DOMException && error.name === "AbortError") {
          lastError = error;
          if (attempt >= this.config.maxRetries) {
            throw error;
          }
        } else {
          lastError = error;
          if (attempt >= this.config.maxRetries) {
            throw error;
          }
        }

        await this.maybeDelay(attempt);
        attempt += 1;
      } finally {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error("HTTP request failed after retries");
  }

  get(url: string, options?: Omit<HttpRequestOptions, "data" | "json">): Promise<Response> {
    return this.request("GET", url, options);
  }

  post(url: string, options: HttpRequestOptions = {}): Promise<Response> {
    return this.request("POST", url, options);
  }
}

export type HttpClient = SyncHttpClient;
