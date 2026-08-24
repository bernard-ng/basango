import { BIAS, RELIABILITY, SENTIMENT, TRANSPARENCY } from "@basango/domain/constants";
import {
  ArticleMetadata,
  Credibility,
  INGESTION_RUN_STATES,
  TokenStatistics,
} from "@basango/domain/models";
import { relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  customType,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

export const biasEnum = pgEnum("bias", BIAS);
export const reliabilityEnum = pgEnum("reliability", RELIABILITY);
export const transparencyEnum = pgEnum("transparency", TRANSPARENCY);

export const sentimentEnum = pgEnum("sentiment", SENTIMENT);
export const ingestionAgentStateEnum = pgEnum("ingestion_agent_state", ["idle", "busy"]);
export const ingestionRunStateEnum = pgEnum("ingestion_run_state", INGESTION_RUN_STATES);
export const ingestionSignalTypeEnum = pgEnum("ingestion_signal_type", [
  "agent.heartbeat",
  "agent.reset",
  "run.preparing",
  "run.started",
  "run.progress",
  "run.completed",
  "run.failed",
]);
/* -------------------------------------------------------------------------- */
/*                                   Tables                                   */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "user",
  {
    banExpires: timestamp("ban_expires"),
    banned: boolean().default(false).notNull(),
    banReason: text("ban_reason"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    id: uuid().primaryKey().notNull(),
    image: text(),
    name: text().notNull(),
    role: text().default("user").notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (_table) => [
    uniqueIndex("unq_user_email").using("btree", sql`lower((email)::text)`),
    index("idx_user_created_at").using("btree", sql`created_at`),
  ],
);

export const sessions = pgTable(
  "session",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: uuid().primaryKey().notNull(),
    impersonatedBy: text("impersonated_by"),
    ipAddress: text("ip_address"),
    token: text().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userAgent: text("user_agent"),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    uniqueIndex("unq_session_token").on(table.token),
    index("idx_session_user_id").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "fk_session_user_id",
    }).onDelete("cascade"),
  ],
);

export const accounts = pgTable(
  "account",
  {
    accessToken: text("access_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    accountId: text("account_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: uuid().primaryKey().notNull(),
    idToken: text("id_token"),
    issuer: text().notNull(),
    password: text(),
    providerId: text("provider_id").notNull(),
    refreshToken: text("refresh_token"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    uniqueIndex("unq_account_issuer_account_id").on(table.issuer, table.accountId),
    index("idx_account_user_id").on(table.userId),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "fk_account_user_id",
    }).onDelete("cascade"),
  ],
);

export const verifications = pgTable(
  "verification",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    id: uuid().primaryKey().notNull(),
    identifier: text().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
    value: text().notNull(),
  },
  (table) => [index("idx_verification_identifier").on(table.identifier)],
);

export const sources = pgTable(
  "source",
  {
    credibility: jsonb("credibility").$type<Credibility>(),
    description: varchar({ length: 1024 }),
    displayName: varchar("display_name", { length: 255 }),
    id: uuid().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    updatedAt: timestamp("updated_at"),
    url: varchar({ length: 255 }).notNull(),
  },
  (_table) => [
    uniqueIndex("unq_source_name").using("btree", sql`lower((name)::text)`),
    uniqueIndex("unq_source_url").using("btree", sql`lower((url)::text)`),
  ],
);

export const categories = pgTable(
  "category",
  {
    candidates: text().array().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    description: varchar({ length: 512 }),
    embeddings: jsonb("embeddings").$type<number[]>(),
    id: uuid().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    slug: varchar({ length: 255 }).notNull(),
    updatedAt: timestamp("updated_at"),
    weight: integer().default(0).notNull(),
  },
  (table) => [
    uniqueIndex("unq_category_name").using("btree", sql`lower((name)::text)`),
    uniqueIndex("unq_category_slug").using("btree", sql`lower((slug)::text)`),
    index("idx_category_weight").using("btree", table.weight.asc().nullsLast()),
  ],
);

export const articles = pgTable(
  "article",
  {
    body: text().notNull(),
    categories: text().array(),
    categoryId: uuid("category_id"),
    clustered: boolean("clustered").default(false).notNull(),
    crawledAt: timestamp("crawled_at").defaultNow().notNull(),
    credibility: jsonb("credibility").$type<Credibility>(),
    excerpt: varchar({ length: 255 }).generatedAlwaysAs(sql`("left"(body, 200) || '...'::text)`),
    hash: varchar({ length: 32 }).notNull(),
    id: uuid().primaryKey().notNull(),
    image: varchar({ length: 1024 }).generatedAlwaysAs(sql`(metadata ->> 'image'::text)`),
    link: varchar({ length: 1024 }).notNull(),
    metadata: jsonb("metadata").$type<ArticleMetadata>(),
    publishedAt: timestamp("published_at").notNull(),
    readingTime: integer("reading_time").default(1),
    sentiment: sentimentEnum("sentiment").notNull(),
    sourceId: uuid("source_id").notNull(),
    title: varchar({ length: 1024 }).notNull(),
    tokenStatistics: jsonb("token_statistics").$type<TokenStatistics>(),
    tsv: tsvector("tsv").generatedAlwaysAs(
      sql`setweight(to_tsvector('french'::regconfig, COALESCE(title, '')::text), 'A'::"char")`,
    ),
    updatedAt: timestamp("updated_at"),
  },
  (table) => [
    index("gin_article_categories").using(
      "gin",
      table.categories.asc().nullsLast().op("array_ops"),
    ),
    index("idx_article_category_id").using("btree", table.categoryId.asc().nullsLast()),
    index("idx_article_clustered").using("btree", table.clustered.asc().nullsLast()),
    index("gin_article_link_trgm").using("gin", table.link.asc().nullsLast().op("gin_trgm_ops")),
    index("gin_article_title_trgm").using("gin", table.title.asc().nullsLast().op("gin_trgm_ops")),
    index("gin_article_tsv").using("gin", table.tsv.asc().nullsLast().op("tsvector_ops")),
    index("idx_article_source_published_id").using(
      "btree",
      table.sourceId.asc().nullsLast(),
      table.publishedAt.desc().nullsFirst(),
      table.id.desc().nullsFirst(),
    ),
    uniqueIndex("unq_article_hash").using("btree", table.hash.asc().nullsLast()),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [categories.id],
      name: "fk_article_category_id",
    }).onDelete("set null"),
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
      name: "fk_article_source_id",
    }).onDelete("cascade"),
    check("chk_article_reading_time", sql`(reading_time >= 0)`),
    check(
      "chk_article_sentiment",
      sql`((sentiment)::text = ANY (ARRAY['positive'::text,'neutral'::text,'negative'::text]))`,
    ),
    check(
      "chk_article_metadata_json",
      sql`((metadata IS NULL) OR (jsonb_typeof(metadata) IN ('object'::text,'array'::text)))`,
    ),
  ],
);

export const ingestionAgents = pgTable(
  "ingestion_agent",
  {
    activeRunId: uuid("active_run_id"),
    id: varchar({ length: 255 }).primaryKey().notNull(),
    lastSeenAt: timestamp("last_seen_at").notNull(),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
    state: ingestionAgentStateEnum().notNull().default("idle"),
    version: varchar({ length: 64 }),
  },
  (table) => [index("idx_ingestion_agent_last_seen").on(table.lastSeenAt)],
);

export const ingestionRuns = pgTable(
  "ingestion_run",
  {
    agentId: varchar("agent_id", { length: 255 }).notNull(),
    articlesDelivered: integer("articles_delivered").default(0).notNull(),
    articlesDiscovered: integer("articles_discovered").default(0).notNull(),
    articlesFailed: integer("articles_failed").default(0).notNull(),
    articlesPersisted: integer("articles_persisted").default(0).notNull(),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").notNull(),
    durationMs: bigint("duration_ms", { mode: "number" }),
    error: text(),
    id: uuid().primaryKey().notNull(),
    lastSignalAt: timestamp("last_signal_at").notNull(),
    sourceId: varchar("source_id", { length: 255 }).notNull(),
    startedAt: timestamp("started_at"),
    state: ingestionRunStateEnum().notNull(),
  },
  (table) => [
    index("idx_ingestion_run_last_signal").on(table.lastSignalAt),
    index("idx_ingestion_run_agent_state").on(table.agentId, table.state),
    check(
      "chk_ingestion_run_metrics_nonnegative",
      sql`${table.articlesDelivered} >= 0 AND ${table.articlesDiscovered} >= 0 AND ${table.articlesFailed} >= 0 AND ${table.articlesPersisted} >= 0`,
    ),
    check(
      "chk_ingestion_run_duration_nonnegative",
      sql`${table.durationMs} IS NULL OR ${table.durationMs} >= 0`,
    ),
  ],
);

export const ingestionActivities = pgTable(
  "ingestion_activity",
  {
    agentId: varchar("agent_id", { length: 255 }).notNull(),
    data: jsonb().$type<Record<string, unknown>>().notNull(),
    id: uuid().primaryKey().notNull(),
    occurredAt: timestamp("occurred_at").notNull(),
    runId: uuid("run_id"),
    sourceId: varchar("source_id", { length: 255 }),
    type: ingestionSignalTypeEnum().notNull(),
  },
  (table) => [
    index("idx_ingestion_activity_occurred").on(table.occurredAt),
    index("idx_ingestion_activity_run_occurred").on(table.runId, table.occurredAt),
  ],
);

export const bookmarks = pgTable(
  "bookmark",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    description: varchar({ length: 512 }),
    id: uuid().primaryKey().notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    name: varchar({ length: 255 }).notNull(),
    updatedAt: timestamp("updated_at"),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_bookmark_user_created").using(
      "btree",
      table.userId.asc().nullsLast(),
      table.createdAt.desc().nullsFirst(),
    ),
    uniqueIndex("unq_bookmark_user_name").using(
      "btree",
      table.userId.asc().nullsLast(),
      sql`lower(${table.name})`,
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "fk_bookmark_user_id",
    }).onDelete("cascade"),
  ],
);

export const bookmarkArticles = pgTable(
  "bookmark_article",
  {
    articleId: uuid("article_id").notNull(),
    bookmarkId: uuid("bookmark_id").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.bookmarkId, table.articleId], name: "bookmark_article_pkey" }),
    index("idx_bookmark_article_bookmark_id").using("btree", table.bookmarkId.asc().nullsLast()),
    foreignKey({
      columns: [table.bookmarkId],
      foreignColumns: [bookmarks.id],
      name: "fk_bookmark_article_bookmark_id",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [articles.id],
      name: "fk_bookmark_article_article_id",
    }).onDelete("cascade"),
  ],
);

export const followedSources = pgTable(
  "followed_source",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    followerId: uuid("follower_id").notNull(),
    id: uuid().primaryKey().notNull(),
    sourceId: uuid("source_id").notNull(),
  },
  (table) => [
    index("idx_followed_source_source_id").using("btree", table.sourceId.asc().nullsLast()),
    index("idx_followed_source_follower_id").using("btree", table.followerId.asc().nullsLast()),
    index("idx_followed_source_follower_created").using(
      "btree",
      table.followerId.asc().nullsLast(),
      table.createdAt.desc().nullsFirst(),
    ),
    uniqueIndex("unq_followed_source_user_source").using(
      "btree",
      table.followerId.asc().nullsLast(),
      table.sourceId.asc().nullsLast(),
    ),
    foreignKey({
      columns: [table.followerId],
      foreignColumns: [users.id],
      name: "fk_followed_source_follower_id",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
      name: "fk_followed_source_source_id",
    }).onDelete("cascade"),
  ],
);

export const comments = pgTable(
  "comment",
  {
    articleId: uuid("article_id").notNull(),
    content: varchar({ length: 512 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: uuid().primaryKey().notNull(),
    isSpam: boolean("is_spam").default(false).notNull(),
    sentiment: sentimentEnum("sentiment").notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_comment_article_id").using("btree", table.articleId.asc().nullsLast()),
    index("idx_comment_user_id").using("btree", table.userId.asc().nullsLast()),
    index("idx_comment_article_created").using(
      "btree",
      table.articleId.asc().nullsLast(),
      table.createdAt.desc().nullsFirst(),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "fk_comment_user_id",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [articles.id],
      name: "fk_comment_article_id",
    }).onDelete("cascade"),
  ],
);

/* -------------------------------------------------------------------------- */
/*                                 Relations                                  */
/* -------------------------------------------------------------------------- */

export const bookmarkRelations = relations(bookmarks, ({ one, many }) => ({
  bookmarkArticles: many(bookmarkArticles),
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
}));

export const userRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  bookmarks: many(bookmarks),
  comments: many(comments),
  followedSources: many(followedSources),
  sessions: many(sessions),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const followedSourceRelations = relations(followedSources, ({ one }) => ({
  source: one(sources, {
    fields: [followedSources.sourceId],
    references: [sources.id],
  }),
  user: one(users, {
    fields: [followedSources.followerId],
    references: [users.id],
  }),
}));

export const sourceRelations = relations(sources, ({ many }) => ({
  articles: many(articles),
  followedSources: many(followedSources),
}));

export const commentRelations = relations(comments, ({ one }) => ({
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const articleRelations = relations(articles, ({ one, many }) => ({
  bookmarkArticles: many(bookmarkArticles),
  category: one(categories, {
    fields: [articles.categoryId],
    references: [categories.id],
  }),
  comments: many(comments),
  source: one(sources, {
    fields: [articles.sourceId],
    references: [sources.id],
  }),
}));

export const categoryRelations = relations(categories, ({ many }) => ({
  articles: many(articles),
}));

export const bookmarkArticleRelations = relations(bookmarkArticles, ({ one }) => ({
  article: one(articles, {
    fields: [bookmarkArticles.articleId],
    references: [articles.id],
  }),
  bookmark: one(bookmarks, {
    fields: [bookmarkArticles.bookmarkId],
    references: [bookmarks.id],
  }),
}));
