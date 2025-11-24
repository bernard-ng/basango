import {
  AnySourceOptions,
  HtmlSourceOptions,
  WordPressSourceOptions,
  config,
} from "@basango/domain/config";
import { DEFAULT_DATE_FORMAT } from "@basango/domain/constants";
import {
  DateSpecSchema,
  PageRange,
  PageRangeSchema,
  PageSpecSchema,
  TimestampRange,
  TimestampRangeSchema,
} from "@basango/domain/models";
import logger from "@basango/logger";
import { format, fromUnixTime, getUnixTime, isMatch, parse } from "date-fns";
import type { RedisOptions } from "ioredis";

import { getSourceUpdateDates } from "./process/persistence";

/**
 * Resolve a source configuration by its ID.
 * @param id - The source ID
 */
export const resolveSourceConfig = (id: string): AnySourceOptions => {
  const source =
    config.crawler.sources.html.find((s: HtmlSourceOptions) => s.sourceId === id) ||
    config.crawler.sources.wordpress.find((s: WordPressSourceOptions) => s.sourceId === id);

  if (source === undefined) {
    throw new Error(`Source '${id}' not found in configuration`);
  }

  return source;
};

export const resolveSourceUpdateDates = async (settings: {
  dateRange?: TimestampRange;
  direction: "forward" | "backward";
  source?: AnySourceOptions;
}) => {
  if (settings.dateRange === undefined && settings.source) {
    const dates = await getSourceUpdateDates(settings.source.sourceId);

    switch (settings.direction) {
      case "backward":
        settings.dateRange = {
          end: getUnixTime(dates.earliest),
          start: getUnixTime(new Date()),
        };
        logger.info(
          { dateRange: settings.dateRange, sourceId: settings.source.sourceId },
          "Set date range start from earliest published date",
        );
        break;
      case "forward":
        if (dates.latest) {
          settings.dateRange = {
            end: getUnixTime(new Date()),
            start: getUnixTime(dates.latest),
          };
          logger.info(
            { dateRange: settings.dateRange, sourceId: settings.source.sourceId },
            "Set date range start from latest published date",
          );
        }
        break;
    }
  }
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
 * Create a page range from a string specification.
 * @param spec - The page range specification (e.g., "1:10")
 */
export const createPageRange = (spec: string | undefined): PageRange | undefined => {
  if (!spec) return undefined;
  const parsed = PageSpecSchema.parse(spec);
  return PageRangeSchema.parse(parsed);
};

/**
 * Create a date range from a string specification.
 * @param spec - The date range specification (e.g., "2023-01-01:2023-12-31")
 * @param options - Options for date range creation
 */
export const createTimestampRange = (
  spec: string | undefined,
  options: {
    format?: string;
    separator?: string;
  } = {},
): TimestampRange | undefined => {
  if (!spec) return undefined;
  const { format = DEFAULT_DATE_FORMAT, separator = ":" } = options;
  if (!separator) {
    throw new Error("Separator cannot be empty");
  }

  const normalized = spec.replace(separator, ":");
  const parsedSpec = DateSpecSchema.parse(normalized);

  const startDate = parseDate(parsedSpec.startRaw, format);
  const endDate = parseDate(parsedSpec.endRaw, format);

  const range = {
    end: getUnixTime(endDate),
    start: getUnixTime(startDate),
  };

  return TimestampRangeSchema.parse(range);
};

/**
 * Format a date range into a string representation.
 * @param range - The date range
 * @param fmt - The date format (default: DEFAULT_DATE_FORMAT)
 */
export const formatTimestampRange = (range: TimestampRange, fmt = DEFAULT_DATE_FORMAT): string => {
  const start = format(fromUnixTime(range.start), fmt);
  const end = format(fromUnixTime(range.end), fmt);
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
export const isTimestampInRange = (range: TimestampRange, timestamp: number): boolean => {
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
