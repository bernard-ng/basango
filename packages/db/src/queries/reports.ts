import { DashboardOverview, DateRange } from "@basango/domain/models";
import { AnyColumn, SQL, count, sql } from "drizzle-orm";

import { Database } from "#db/client";
import { articles, sources, users } from "#db/schema";
import { buildDateRange, buildPreviousRange, computeDelta } from "#db/utils";

const withinRange = (column: AnyColumn, range: DateRange): SQL<unknown> =>
  sql`${column} >= ${range.start} AND ${column} < ${range.end}`;

const countArticles = async (db: Database, where?: SQL<unknown>) => {
  const query = db.select({ count: count(articles.id) }).from(articles);
  const rows = where ? query.where(where) : query;

  const [result] = await rows;
  return Number(result?.count ?? 0);
};

const countUsers = async (db: Database, where?: SQL<unknown>) => {
  const query = db.select({ count: count(users.id) }).from(users);
  const rows = where ? query.where(where) : query;

  const [result] = await rows;
  return Number(result?.count ?? 0);
};

const countSources = async (db: Database) => {
  const [result] = await db.select({ count: count(sources.id) }).from(sources);
  return Number(result?.count ?? 0);
};

const countActiveSourcesInRange = async (db: Database, range: DateRange) => {
  const [result] = await db
    .select({
      count: sql<number>`CAST(COUNT(DISTINCT ${articles.sourceId}) AS INT)`,
    })
    .from(articles)
    .where(withinRange(articles.publishedAt, range));

  return Number(result?.count ?? 0);
};

export const getDashboardOverview = async (db: Database): Promise<DashboardOverview> => {
  const current = buildDateRange();
  const previous = buildPreviousRange(current);
  const ranges = { current, previous };

  const [totalArticles, totalUsers, totalSources] = await Promise.all([
    countArticles(db),
    countUsers(db),
    countSources(db),
  ]);

  const [articlesCurrent, articlesPrevious] = await Promise.all([
    countArticles(db, withinRange(articles.publishedAt, ranges.current)),
    countArticles(db, withinRange(articles.publishedAt, ranges.previous)),
  ]);

  const [usersCurrent, usersPrevious] = await Promise.all([
    countUsers(db, withinRange(users.createdAt, ranges.current)),
    countUsers(db, withinRange(users.createdAt, ranges.previous)),
  ]);

  const [sourcesCurrent, sourcesPrevious] = await Promise.all([
    countActiveSourcesInRange(db, ranges.current),
    countActiveSourcesInRange(db, ranges.previous),
  ]);

  return {
    articles: {
      delta: computeDelta(articlesCurrent, articlesPrevious),
      total: totalArticles,
    },
    sources: {
      delta: computeDelta(sourcesCurrent, sourcesPrevious),
      total: totalSources,
    },
    users: {
      delta: computeDelta(usersCurrent, usersPrevious),
      total: totalUsers,
    },
  };
};
