import type { CommentList, CreateComment } from "@basango/domain/models";
import { and, count, desc, eq } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import type { Database } from "#db/client";
import { NotFoundError } from "#db/errors";
import { comments, users } from "#db/schema";
import { buildPaginatedResult, buildPaginationState } from "#db/utils";

export async function getReaderComments(db: Database, params: CommentList) {
  const pagination = buildPaginationState(params);
  const filter = and(eq(comments.articleId, params.articleId), eq(comments.isSpam, false));
  const [rows, total] = await Promise.all([
    db
      .select({
        author: {
          id: users.id,
          image: users.image,
          name: users.name,
        },
        content: comments.content,
        createdAt: comments.createdAt,
        id: comments.id,
        sentiment: comments.sentiment,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(filter)
      .orderBy(desc(comments.createdAt), desc(comments.id))
      .limit(pagination.limit)
      .offset(pagination.offset),
    db
      .select({ value: count(comments.id) })
      .from(comments)
      .where(filter)
      .then((result) => result[0]?.value ?? 0),
  ]);

  return buildPaginatedResult(rows, pagination, total);
}

export async function createReaderComment(db: Database, userId: string, input: CreateComment) {
  const [comment] = await db
    .insert(comments)
    .values({
      articleId: input.articleId,
      content: input.content,
      id: uuidv7(),
      sentiment: "neutral",
      userId,
    })
    .returning();

  if (comment === undefined) {
    throw new Error("Unable to add comment");
  }

  const author = await db.query.users.findFirst({
    columns: { id: true, image: true, name: true },
    where: eq(users.id, userId),
  });

  if (author === undefined) {
    throw new NotFoundError("Comment author not found");
  }

  return { ...comment, author };
}

export async function deleteReaderComment(db: Database, userId: string, id: string) {
  const [comment] = await db
    .delete(comments)
    .where(and(eq(comments.id, id), eq(comments.userId, userId)))
    .returning({ id: comments.id });

  if (comment === undefined) {
    throw new NotFoundError("Comment not found");
  }

  return comment;
}
