import type { SourceList } from "@basango/domain/models/public";
import { type SQL, and, asc, count, eq, ilike, sql } from "drizzle-orm";
import { v7 as uuidv7 } from "uuid";

import type { Database } from "#db/client";
import { NotFoundError } from "#db/errors";
import { articles, followedSources, sources } from "#db/schema";
import { applyFilters, buildPaginatedResult, buildPaginationState } from "#db/utils";

export async function getSources(db: Database, userId: string | undefined, params: SourceList) {
  const pagination = buildPaginationState(params);
  const filters = buildSourceFilters(userId, params);
  const query = db
    .select({
      articlesCount: count(articles.id),
      description: sources.description,
      displayName: sources.displayName,
      followed: followedSourceSelection(userId),
      id: sources.id,
      name: sources.name,
      url: sources.url,
    })
    .from(sources)
    .leftJoin(articles, eq(articles.sourceId, sources.id));

  const [rows, total] = await Promise.all([
    applyFilters(query, filters)
      .groupBy(sources.id)
      .orderBy(asc(sources.name), asc(sources.id))
      .limit(pagination.limit)
      .offset(pagination.offset),
    applyFilters(db.select({ value: count(sources.id) }).from(sources), filters).then(
      (result: { value: number }[]) => result[0]?.value ?? 0,
    ),
  ]);

  return buildPaginatedResult(rows, pagination, total);
}

export async function getSourceById(db: Database, userId: string | undefined, id: string) {
  const [source] = await db
    .select({
      articlesCount: count(articles.id),
      description: sources.description,
      displayName: sources.displayName,
      followed: followedSourceSelection(userId),
      id: sources.id,
      name: sources.name,
      url: sources.url,
    })
    .from(sources)
    .leftJoin(articles, eq(articles.sourceId, sources.id))
    .where(eq(sources.id, id))
    .groupBy(sources.id)
    .limit(1);

  if (source === undefined) {
    throw new NotFoundError("Source not found");
  }

  return source;
}

export async function followSource(db: Database, userId: string, sourceId: string) {
  await db
    .insert(followedSources)
    .values({ followerId: userId, id: uuidv7(), sourceId })
    .onConflictDoNothing();

  return { followed: true, sourceId };
}

export async function unfollowSource(db: Database, userId: string, sourceId: string) {
  await db
    .delete(followedSources)
    .where(and(eq(followedSources.followerId, userId), eq(followedSources.sourceId, sourceId)));

  return { followed: false, sourceId };
}

function buildSourceFilters(userId: string | undefined, params: SourceList): SQL<unknown>[] {
  const filters: SQL<unknown>[] = [];

  if (params.search) {
    filters.push(ilike(sources.name, `%${params.search}%`));
  }

  if (params.followedOnly) {
    filters.push(
      userId
        ? sql`exists (
            select 1
            from ${followedSources}
            where ${followedSources.followerId} = ${userId}
              and ${followedSources.sourceId} = ${sources.id}
          )`
        : sql`false`,
    );
  }

  return filters;
}

function followedSourceSelection(userId: string | undefined) {
  if (!userId) {
    return sql<boolean>`false`;
  }

  return sql<boolean>`exists (
    select 1
    from ${followedSources}
    where ${followedSources.followerId} = ${userId}
      and ${followedSources.sourceId} = ${sources.id}
  )`;
}
