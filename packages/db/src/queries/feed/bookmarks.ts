import type {
  BookmarkArticleList,
  BookmarkList,
  CreateBookmark,
  UpdateBookmark,
} from "@basango/domain/models";
import { and, count, desc, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import type { Database } from "#db/client";
import { NotFoundError } from "#db/errors";
import { readerArticleOverviewSelection } from "#db/queries/feed/articles";
import { articles, bookmarkArticles, bookmarks, categories, sources } from "#db/schema";
import { buildPaginatedResult, buildPaginationState } from "#db/utils";

export async function getReaderBookmarks(db: Database, userId: string, params: BookmarkList) {
  const pagination = buildPaginationState(params);
  const [rows, total] = await Promise.all([
    db
      .select({
        articlesCount: count(bookmarkArticles.articleId),
        createdAt: bookmarks.createdAt,
        description: bookmarks.description,
        id: bookmarks.id,
        isPublic: bookmarks.isPublic,
        name: bookmarks.name,
        updatedAt: bookmarks.updatedAt,
      })
      .from(bookmarks)
      .leftJoin(bookmarkArticles, eq(bookmarks.id, bookmarkArticles.bookmarkId))
      .where(eq(bookmarks.userId, userId))
      .groupBy(bookmarks.id)
      .orderBy(desc(bookmarks.createdAt), desc(bookmarks.id))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db
      .select({ value: count(bookmarks.id) })
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .then((result) => result[0]?.value ?? 0),
  ]);

  return buildPaginatedResult(rows, pagination, total);
}

export async function createReaderBookmark(db: Database, userId: string, input: CreateBookmark) {
  const [bookmark] = await db
    .insert(bookmarks)
    .values({
      description: input.description,
      id: uuidv7(),
      isPublic: input.isPublic,
      name: input.name,
      userId,
    })
    .returning();

  if (bookmark === undefined) {
    throw new Error("Unable to create bookmark");
  }

  return { ...bookmark, articlesCount: 0 };
}

export async function updateReaderBookmark(db: Database, userId: string, input: UpdateBookmark) {
  const [bookmark] = await db
    .update(bookmarks)
    .set({
      description: input.description,
      isPublic: input.isPublic,
      name: input.name,
      updatedAt: new Date(),
    })
    .where(and(eq(bookmarks.id, input.id), eq(bookmarks.userId, userId)))
    .returning();

  if (bookmark === undefined) {
    throw new NotFoundError("Bookmark not found");
  }

  const [articleCount] = await db
    .select({ value: count(bookmarkArticles.articleId) })
    .from(bookmarkArticles)
    .where(eq(bookmarkArticles.bookmarkId, bookmark.id));

  return { ...bookmark, articlesCount: articleCount?.value ?? 0 };
}

export async function deleteReaderBookmark(db: Database, userId: string, id: string) {
  const [bookmark] = await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)))
    .returning({ id: bookmarks.id });

  if (bookmark === undefined) {
    throw new NotFoundError("Bookmark not found");
  }

  return bookmark;
}

export async function getReaderBookmarkArticles(
  db: Database,
  userId: string,
  params: BookmarkArticleList,
) {
  await getOwnedBookmark(db, userId, params.bookmarkId);

  const pagination = buildPaginationState(params);
  const filter = eq(bookmarkArticles.bookmarkId, params.bookmarkId);
  const [rows, total] = await Promise.all([
    db
      .select(readerArticleOverviewSelection)
      .from(bookmarkArticles)
      .innerJoin(articles, eq(bookmarkArticles.articleId, articles.id))
      .leftJoin(categories, eq(articles.categoryId, categories.id))
      .innerJoin(sources, eq(articles.sourceId, sources.id))
      .where(filter)
      .orderBy(desc(articles.publishedAt), desc(articles.id))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db
      .select({ value: count(bookmarkArticles.articleId) })
      .from(bookmarkArticles)
      .where(filter)
      .then((result) => result[0]?.value ?? 0),
  ]);

  return buildPaginatedResult(rows, pagination, total);
}

export async function getReaderArticleBookmarkMemberships(
  db: Database,
  userId: string,
  articleId: string,
) {
  const rows = await db
    .select({ bookmarkId: bookmarkArticles.bookmarkId })
    .from(bookmarkArticles)
    .innerJoin(
      bookmarks,
      and(eq(bookmarks.id, bookmarkArticles.bookmarkId), eq(bookmarks.userId, userId)),
    )
    .where(eq(bookmarkArticles.articleId, articleId));

  return { bookmarkIds: rows.map((row) => row.bookmarkId) };
}

export async function addReaderArticleToBookmark(
  db: Database,
  userId: string,
  bookmarkId: string,
  articleId: string,
) {
  await getOwnedBookmark(db, userId, bookmarkId);

  await db.insert(bookmarkArticles).values({ articleId, bookmarkId }).onConflictDoNothing();

  return { articleId, bookmarkId, saved: true };
}

export async function removeReaderArticleFromBookmark(
  db: Database,
  userId: string,
  bookmarkId: string,
  articleId: string,
) {
  await getOwnedBookmark(db, userId, bookmarkId);

  await db
    .delete(bookmarkArticles)
    .where(
      and(eq(bookmarkArticles.bookmarkId, bookmarkId), eq(bookmarkArticles.articleId, articleId)),
    );

  return { articleId, bookmarkId, saved: false };
}

async function getOwnedBookmark(db: Database, userId: string, id: string) {
  const bookmark = await db.query.bookmarks.findFirst({
    columns: { id: true },
    where: and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)),
  });

  if (bookmark === undefined) {
    throw new NotFoundError("Bookmark not found");
  }

  return bookmark;
}
