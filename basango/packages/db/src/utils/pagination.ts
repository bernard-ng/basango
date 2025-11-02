import { Buffer } from "node:buffer";

export type SortDirection = "asc" | "desc";

export interface PageRequest {
  page?: number;
  limit?: number;
  cursor?: string | null;
}

export interface PageState {
  page: number;
  limit: number;
  cursor: string | null;
  offset: number;
}

export interface CursorPayload {
  id: string;
  date?: string | null;
}

export interface PaginationMeta {
  current: number;
  limit: number;
  cursor: string | null;
  hasNext: boolean;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 100;

export function createPageState(request: PageRequest = {}): PageState {
  const page =
    Number.isFinite(request.page) && (request.page ?? 0) > 0
      ? Math.trunc(request.page!)
      : DEFAULT_PAGE;

  let limit =
    Number.isFinite(request.limit) && (request.limit ?? 0) > 0
      ? Math.trunc(request.limit!)
      : DEFAULT_LIMIT;

  if (limit < DEFAULT_LIMIT) {
    limit = DEFAULT_LIMIT;
  }

  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const cursor = request.cursor ?? null;
  const offset = (page - 1) * limit;

  return { page, limit, cursor, offset };
}

export function encodeCursor(
  row: Record<string, unknown>,
  keyset: { id: string; date?: string | null },
): string {
  const payload: CursorPayload = {
    id: String(row[keyset.id] ?? ""),
  };

  if (keyset.date) {
    const value = row[keyset.date];
    if (value !== undefined && value !== null) {
      payload.date = String(value);
    }
  }

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

export function decodeCursor(cursor?: string | null): CursorPayload | null {
  if (!cursor) {
    return null;
  }

  try {
    const decoded = Buffer.from(cursor, "base64").toString("utf8");
    const payload = JSON.parse(decoded) as CursorPayload;

    if (!payload || typeof payload.id !== "string" || payload.id.length === 0) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function buildPaginationResult<T extends Record<string, unknown>>(
  rows: T[],
  page: PageState,
  keyset: { id: string; date?: string | null },
): { data: T[]; pagination: PaginationMeta } {
  const hasNext = rows.length > page.limit;
  const data = hasNext ? rows.slice(0, page.limit) : rows;

  let cursor: string | null = null;
  if (data.length > 0) {
    const lastRow = data[data.length - 1];
    cursor = encodeCursor(lastRow, keyset);
  }

  return {
    data,
    pagination: {
      current: page.page,
      limit: page.limit,
      cursor,
      hasNext,
    },
  };
}
