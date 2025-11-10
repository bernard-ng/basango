import { Buffer } from "node:buffer";

import {
  PAGINATION_DEFAULT_LIMIT,
  PAGINATION_DEFAULT_PAGE,
  PAGINATION_MAX_LIMIT,
} from "@/constants";

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

export function createPageState(request: PageRequest = {}): PageState {
  const page =
    Number.isFinite(request.page) && (request.page ?? 0) > 0
      ? Math.trunc(request.page!)
      : PAGINATION_DEFAULT_PAGE;

  let limit =
    Number.isFinite(request.limit) && (request.limit ?? 0) > 0
      ? Math.trunc(request.limit!)
      : PAGINATION_DEFAULT_LIMIT;

  if (limit < PAGINATION_DEFAULT_LIMIT) {
    limit = PAGINATION_DEFAULT_LIMIT;
  }

  if (limit > PAGINATION_MAX_LIMIT) {
    limit = PAGINATION_MAX_LIMIT;
  }

  const cursor = request.cursor ?? null;
  const offset = (page - 1) * limit;

  return { cursor, limit, offset, page };
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
