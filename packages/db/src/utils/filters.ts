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

export function buildDateRange(range?: DateRange): DateRange {
  const end = endOfDay(range?.end ?? new Date());
  const start = startOfDay(
    range?.start ?? subDays(end, Math.max(DEFAULT_PUBLICATION_GRAPH_DAYS - 1, 0)),
  );

  return { end, start };
}

export function buildPreviousRange(range: DateRange): DateRange {
  const days = Math.max(
    1,
    Math.round((range.end.getTime() - range.start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
  );

  const end = endOfDay(subDays(range.start, 1));
  const start = startOfDay(subDays(end, days - 1));

  return { end, start };
}
