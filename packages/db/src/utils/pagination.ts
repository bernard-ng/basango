import { Buffer } from "node:buffer";

import {
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_MAX_LIMIT,
  DEFAULT_PAGINATION_PAGE,
} from "@basango/domain/constants";
import {
  PaginatedResult,
  PaginationCursor,
  PaginationRequest,
  PaginationState,
} from "@basango/domain/models";
import { isValid, toDate } from "date-fns";
import { AnyColumn, SQL, and, eq, lt, or } from "drizzle-orm";

export function buildPaginationState(request: PaginationRequest = {}): PaginationState {
  const page =
    Number.isFinite(request.page) && (request.page ?? 0) > 0
      ? Math.trunc(request.page!)
      : DEFAULT_PAGINATION_PAGE;

  let limit =
    Number.isFinite(request.limit) && (request.limit ?? 0) > 0
      ? Math.trunc(request.limit!)
      : DEFAULT_PAGINATION_LIMIT;

  if (limit < DEFAULT_PAGINATION_LIMIT) {
    limit = DEFAULT_PAGINATION_LIMIT;
  }

  if (limit > DEFAULT_PAGINATION_MAX_LIMIT) {
    limit = DEFAULT_PAGINATION_MAX_LIMIT;
  }

  const cursor = request.cursor ?? null;
  const payload = decodeCursor(cursor);
  const offset = (page - 1) * limit;

  return { cursor, limit, offset, page, payload };
}

export function buildPaginatedResult<T>(
  rows: T[],
  pagination: PaginationState,
  cursor: PaginationCursor,
): PaginatedResult<T> {
  const hasNext = rows.length > pagination.limit;
  const items = rows.slice(0, pagination.limit);
  const lastItem = items[items.length - 1];

  return {
    items,
    meta: {
      current: pagination.page,
      cursor: pagination.cursor,
      hasNext,
      limit: pagination.limit,
      nextCursor: hasNext && lastItem ? encodeCursor(lastItem, cursor) : null,
    },
  };
}

export function applyFilters(
  // biome-ignore lint/suspicious/noExplicitAny: drizzle types to be fixed
  query: any,
  filters: SQL<unknown>[],
): typeof query {
  if (filters.length === 1) {
    return query.where(filters[0]);
  } else if (filters.length > 1) {
    return query.where(and(...filters));
  }
  return query;
}

export function encodeCursor(row: Record<string, string>, keyset: PaginationCursor): string {
  const payload: PaginationCursor = {
    date: String(row[keyset.date]),
    id: String(row[keyset.id]),
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decodeCursor(cursor?: string | null): PaginationCursor | null {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    const payload = JSON.parse(decoded) as PaginationCursor;

    if (!payload || payload.id.length === 0) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

type BuildKeysetOptions = {
  cursor: PaginationCursor | null;
  date: AnyColumn;
  id: AnyColumn;
};

export function buildKeysetFilter(options: BuildKeysetOptions): SQL<unknown> | undefined {
  if (!options.cursor) return undefined;

  if (isValid(options.cursor.date)) {
    const date = toDate(options.cursor.date);

    return or(
      lt(options.date, date),
      and(eq(options.date, date), lt(options.id, options.cursor.id)),
    );
  }

  return lt(options.id, options.cursor.id);
}
