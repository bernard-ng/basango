import { format, getUnixTime, isMatch, parse } from "date-fns";
import type { RedisOptions } from "ioredis";
import { get_encoding, TiktokenEncoding } from "tiktoken";
import { config } from "@/config";
import { DEFAULT_DATE_FORMAT } from "@/constants";
import {
  AnySourceConfig,
  CreateDateRangeOptions,
  DateRange,
  DateRangeSchema,
  DateRangeSpecSchema,
  HtmlSourceConfig,
  PageRange,
  PageRangeSchema,
  PageRangeSpecSchema,
  WordPressSourceConfig,
} from "@/schema";

/**
 * Resolve a source configuration by its ID.
 * @param id - The source ID
 */
export const resolveSourceConfig = (id: string): AnySourceConfig => {
  const source =
    config.sources.html.find((s: HtmlSourceConfig) => s.sourceId === id) ||
    config.sources.wordpress.find((s: WordPressSourceConfig) => s.sourceId === id);

  if (source === undefined) {
    throw new Error(`Source '${id}' not found in configuration`);
  }

  return source;
};

/**
 * Parse a Redis URL into RedisOptions.
 * @param url - The Redis URL (e.g., "redis://:password@localhost:6379/0")
 */
export const parseRedisUrl = (url: string): RedisOptions => {
  if (!url.startsWith("redis://")) {
    return {};
  }
  const parsed = new URL(url);
  return {
    db: Number(parsed.pathname?.replace("/", "") || 0),
    host: parsed.hostname,
    password: parsed.password || undefined,
    port: Number(parsed.port || 6379),
  };
};

/**
 * Parse a date string using the specified format.
 * @param value - The date string to parse
 * @param format - The date format
 */
const parseDate = (value: string, format: string): Date => {
  if (!isMatch(value, format)) {
    throw new Error(`Invalid date '${value}' for format '${format}'`);
  }
  const parsed = parse(value, format, new Date());
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date '${value}' for format '${format}'`);
  }
  return parsed;
};

/**
 * Count the number of tokens in the given text using the specified encoding.
 * @param text - The input text
 * @param encoding - The token encoding (default: "cl100k_base")
 */
export const countTokens = (text: string, encoding: TiktokenEncoding = "cl100k_base"): number => {
  try {
    const encoder = get_encoding(encoding);
    const tokens = encoder.encode(text);
    encoder.free();
    return tokens.length;
  } catch {
    return text.length;
  }
};

/**
 * Create a page range from a string specification.
 * @param spec - The page range specification (e.g., "1:10")
 */
export const createPageRange = (spec: string | undefined): PageRange | undefined => {
  if (!spec) return undefined;
  const parsed = PageRangeSpecSchema.parse(spec);
  return PageRangeSchema.parse(parsed);
};

/**
 * Create a date range from a string specification.
 * @param spec - The date range specification (e.g., "2023-01-01:2023-12-31")
 * @param options - Options for date range creation
 */
export const createDateRange = (
  spec: string | undefined,
  options: CreateDateRangeOptions = {},
): DateRange | undefined => {
  if (!spec) return undefined;
  const { format = DEFAULT_DATE_FORMAT, separator = ":" } = options;
  if (!separator) {
    throw new Error("Separator cannot be empty");
  }

  const normalized = spec.replace(separator, ":");
  const parsedSpec = DateRangeSpecSchema.parse(normalized);

  const startDate = parseDate(parsedSpec.startRaw, format);
  const endDate = parseDate(parsedSpec.endRaw, format);

  const range = {
    end: getUnixTime(endDate),
    start: getUnixTime(startDate),
  };

  return DateRangeSchema.parse(range);
};

/**
 * Format a date range into a string representation.
 * @param range - The date range
 * @param fmt - The date format (default: DEFAULT_DATE_FORMAT)
 */
export const formatDateRange = (range: DateRange, fmt = DEFAULT_DATE_FORMAT): string => {
  const start = format(new Date(range.start * 1000), fmt);
  const end = format(new Date(range.end * 1000), fmt);
  return `${start}:${end}`;
};

/**
 * Format a page range into a string representation.
 * @param range - The page range
 */
export const formatPageRange = (range: PageRange): string => {
  return `${range.start}:${range.end}`;
};

/**
 * Check if a timestamp is within a given date range.
 * @param range - The date range
 * @param timestamp - The timestamp to check
 */
export const isTimestampInRange = (range: DateRange, timestamp: number): boolean => {
  return range.start <= timestamp && timestamp <= range.end;
};

/**
 * Convert a relative URL to an absolute URL based on the base URL.
 * @param base - The base URL
 * @param href - The relative or absolute URL
 */
export const createAbsoluteUrl = (base: string, href: string): string => {
  try {
    // new URL handles relative paths with base
    return new URL(href, base.endsWith("/") ? base : `${base}/`).toString();
  } catch {
    return href;
  }
};
