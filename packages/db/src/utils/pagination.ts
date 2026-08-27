import {
  DEFAULT_PAGINATION_LIMIT,
  DEFAULT_PAGINATION_MAX_LIMIT,
  DEFAULT_PAGINATION_PAGE,
} from "@basango/domain/constants";
import type { PaginatedResult, PaginationRequest, PaginationState } from "@basango/domain/models";
import { type SQL, and } from "drizzle-orm";

export function buildPaginationState(request: PaginationRequest = {}): PaginationState {
  const requestedPage = request.page;
  const page =
    Number.isFinite(requestedPage) && requestedPage !== undefined && requestedPage > 0
      ? Math.trunc(requestedPage)
      : DEFAULT_PAGINATION_PAGE;

  const requestedLimit = request.limit;
  let limit =
    Number.isFinite(requestedLimit) && requestedLimit !== undefined && requestedLimit > 0
      ? Math.trunc(requestedLimit)
      : DEFAULT_PAGINATION_LIMIT;

  if (limit > DEFAULT_PAGINATION_MAX_LIMIT) {
    limit = DEFAULT_PAGINATION_MAX_LIMIT;
  }

  const offset = (page - 1) * limit;

  return { limit, offset, page };
}

export function buildPaginatedResult<T>(
  rows: T[],
  pagination: PaginationState,
  total: number,
): PaginatedResult<T> {
  const pages = Math.max(1, Math.ceil(total / pagination.limit));

  return {
    items: rows,
    meta: {
      current: pagination.page,
      hasNext: pagination.page < pages,
      hasPrevious: pagination.page > 1,
      limit: pagination.limit,
      offset: pagination.offset,
      pages,
      total,
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
