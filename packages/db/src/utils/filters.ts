import { DEFAULT_PUBLICATION_GRAPH_DAYS } from "@basango/domain/constants";
import { DateRange } from "@basango/domain/models";
import { endOfDay, startOfDay, subDays } from "date-fns";

export const buildSearchQuery = (input: string) => {
  const trimmed = input.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed
    .split(/\s+/)
    .map((term) => {
      // Escape special characters for PostgreSQL full-text search
      // Special characters: & | ! ( ) : * ' " + - ~
      const escaped = term.toLowerCase().replace(/[&|!():*'"+~-]/g, "\\$&");
      return `${escaped}:*`;
    })
    .join(" & ");
};

/**
 * Resolve a date range given an explicit range.
 * Defaults to the last 30 days when no range is provided.
 */
export function buildDateRange(range?: DateRange): [startDate: Date, endDate: Date] {
  const endDate = endOfDay(range?.end ?? new Date());
  const startDate = startOfDay(
    range?.start ?? subDays(endDate, Math.max(DEFAULT_PUBLICATION_GRAPH_DAYS - 1, 0)),
  );

  return [startDate, endDate];
}

/**
 * Given a [start, end] date range, produce the immediately preceding range of the same length.
 */
export function buildPreviousRange([startDate, endDate]: [Date, Date]): [Date, Date] {
  const days = Math.max(
    1,
    Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  const previousRangeEnd = endOfDay(subDays(startDate, 1));
  const previousRangeStart = startOfDay(subDays(previousRangeEnd, days - 1));

  return [previousRangeStart, previousRangeEnd];
}
