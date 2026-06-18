import { DEFAULT_DATE_FORMAT } from "@basango/domain/constants";
import {
  DateSpecSchema,
  type PageRange,
  PageRangeSchema,
  PageSpecSchema,
  type TimestampRange,
  TimestampRangeSchema,
} from "@basango/domain/models";
import { format, fromUnixTime, getUnixTime, isMatch, parse } from "date-fns";

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

export const createPageRange = (spec: string | undefined): PageRange | undefined => {
  if (!spec) return undefined;
  const parsed = PageSpecSchema.parse(spec);
  return PageRangeSchema.parse(parsed);
};

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

  return TimestampRangeSchema.parse({
    end: getUnixTime(endDate),
    start: getUnixTime(startDate),
  });
};

export const formatTimestampRange = (range: TimestampRange, fmt = DEFAULT_DATE_FORMAT): string => {
  const start = format(fromUnixTime(range.start), fmt);
  const end = format(fromUnixTime(range.end), fmt);
  return `${start}:${end}`;
};

export const formatPageRange = (range: PageRange): string => {
  return `${range.start}:${range.end}`;
};

export const isTimestampInRange = (range: TimestampRange, timestamp: number): boolean => {
  return range.start <= timestamp && timestamp <= range.end;
};

export const createAbsoluteUrl = (base: string, href: string): string => {
  try {
    return new URL(href, base.endsWith("/") ? base : `${base}/`).toString();
  } catch {
    return href;
  }
};
