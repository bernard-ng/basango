/**
 * Default date format used for parsing and formatting dates.
 * Follows the "yyyy-LL-dd" pattern (e.g., "2024-06-15").
 */
export const DEFAULT_DATE_FORMAT = "yyyy-LL-dd";

/**
 * Default User-Agent string for HTTP requests made by the crawler.
 * Some websites may block requests with missing or generic User-Agent headers.
 */
export const DEFAULT_USER_AGENT = "Basango/0.1 (+https://github.com/bernard-ng/basango)";

/**
 * User-Agent string used for Open Graph requests.
 * Some services require a specific User-Agent to return Open Graph data.
 */
export const OPEN_GRAPH_USER_AGENT = "facebookexternalhit/1.1";

/**
 * HTTP status codes considered transient errors.
 * Used for retry logic in HTTP clients.
 */
export const TRANSIENT_HTTP_STATUSES = [429, 500, 502, 503, 504];

/**
 * Default header name for Retry-After responses.
 * Used when handling rate limiting.
 */
export const DEFAULT_RETRY_AFTER_HEADER = "retry-after";
