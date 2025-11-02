import type { SQL } from "drizzle-orm";
import { and, desc, eq, lt, sql } from "drizzle-orm";

import type { Database } from "@db/client";
import { bookmarkArticles, bookmarks } from "@db/schema";
import {
  buildPaginationResult,
  createPageState,
  decodeCursor,
  type PageRequest,
  type PaginationMeta,
} from "@db/utils/pagination";

export interface BookmarkRow {
  bookmark_id: string;
  bookmark_name: string;
  bookmark_description: string | null;
  bookmark_created_at: string;
  bookmark_updated_at: string | null;
  bookmark_articles_count: number;
  bookmark_is_public: boolean;
}

export interface BookmarkListResult {
  data: BookmarkRow[];
  pagination: PaginationMeta;
}

export async function getBookmarkList(
  db: Database,
  params: { userId: string; page?: PageRequest },
): Promise<BookmarkListResult> {
  const page = createPageState(params.page);
  const whereConditions: SQL[] = [eq(bookmarks.userId, params.userId)];

  const cursor = decodeCursor(page.cursor);
  if (cursor?.id) {
    whereConditions.push(lt(bookmarks.id, cursor.id));
  }

  let query = db
    .select({
      bookmark_id: bookmarks.id,
      bookmark_name: bookmarks.name,
      bookmark_description: bookmarks.description,
      bookmark_created_at: bookmarks.createdAt,
      bookmark_updated_at: bookmarks.updatedAt,
      bookmark_articles_count: sql<number>`count(${bookmarkArticles.articleId})`,
      bookmark_is_public: bookmarks.isPublic,
    })
    .from(bookmarks)
    .leftJoin(bookmarkArticles, eq(bookmarkArticles.bookmarkId, bookmarks.id))
    .groupBy(bookmarks.id);

  if (whereConditions.length === 1) {
    query = query.where(whereConditions[0]);
  } else if (whereConditions.length > 1) {
    query = query.where(and(...whereConditions));
  }

  const rows = await query
    .orderBy(desc(bookmarks.createdAt), desc(bookmarks.id))
    .limit(page.limit + 1);

  return buildPaginationResult(rows, page, { id: "bookmark_id" });
}
