import { BIAS, RELIABILITY, SENTIMENT, TRANSPARENCY } from "@basango/domain/constants";
import {
  ArticleMetadata,
  Credibility,
  Device,
  GeoLocation,
  Roles,
  TokenStatistics,
} from "@basango/domain/models";
import { relations, sql } from "drizzle-orm";
import { check } from "drizzle-orm/gel-core";
import {
  boolean,
  customType,
  foreignKey,
  index,
  inet,
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

pgEnum("bias", BIAS);
pgEnum("reliability", RELIABILITY);
pgEnum("transparency", TRANSPARENCY);

const sentimentEnum = pgEnum("sentiment", SENTIMENT);
const tokenPurposeEnum = pgEnum("token_purpose", [
  "confirm_account",
  "password_reset",
  "unlock_account",
  "delete_account",
]);

/* -------------------------------------------------------------------------- */
/*                                   Tables                                   */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "user",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    email: varchar({ length: 255 }).notNull(),
    id: uuid().primaryKey().notNull(),
    isConfirmed: boolean("is_confirmed").default(false).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    name: varchar({ length: 255 }).notNull(),
    password: varchar({ length: 512 }).notNull(),
    roles: varchar("roles", { length: 255 })
      .$type<Roles>()
      .array()
      .notNull()
      .default(["ROLE_USER"]),
    updatedAt: timestamp("updated_at"),
  },
  (_table) => [
    uniqueIndex("unq_user_email").using("btree", sql`lower((email)::text)`),
    index("idx_user_created_at").using("btree", sql`created_at`),
    sql`CONSTRAINT "chk_user_roles_json" CHECK (jsonb_typeof(roles) = 'array')`,
  ],
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

export const articles = pgTable(
  "article",
  {
    body: text().notNull(),
    categories: text().array(),
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

export const loginAttempts = pgTable(
  "login_attempt",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: uuid().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_login_attempt_user_created").using(
      "btree",
      table.userId.asc().nullsLast(),
      table.createdAt.desc().nullsFirst(),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "fk_login_attempt_user_id",
    }).onDelete("cascade"),
  ],
);

export const loginHistory = pgTable(
  "login_history",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    device: jsonb("device").$type<Device>(),
    id: uuid().primaryKey().notNull(),
    ipAddress: inet("ip_address"),
    location: jsonb("location").$type<GeoLocation>(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_login_history_user_created").using(
      "btree",
      table.userId.asc().nullsLast(),
      table.createdAt.desc().nullsFirst(),
    ),
    index("idx_login_history_ip_address").using("btree", table.ipAddress.asc().nullsLast()),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "fk_login_history_user_id",
    }).onDelete("cascade"),
  ],
);

export const verificationTokens = pgTable(
  "verification_token",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    id: uuid().primaryKey().notNull(),
    purpose: tokenPurposeEnum("purpose").notNull(),
    token: varchar({ length: 60 }), // nullable if you support "reservations" before issue
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_verif_token_created_at").using("btree", table.createdAt.desc().nullsFirst()),
    uniqueIndex("unq_verif_user_purpose_token")
      .using("btree", table.userId, table.purpose, table.token)
      .where(sql`${table.token} IS NOT NULL`),
    uniqueIndex("unq_verif_token_token")
      .using("btree", table.token)
      .where(sql`${table.token} IS NOT NULL`),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "fk_verification_token_user_id",
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

export const refreshTokens = pgTable(
  "refresh_token",
  {
    id: uuid().primaryKey().notNull(),
    token: varchar("token", { length: 128 }).notNull(),
    username: varchar({ length: 255 }).notNull(),
    valid: timestamp().notNull(),
  },
  (table) => [
    uniqueIndex("uniq_refresh_token_token").using("btree", table.token.asc().nullsLast()),
    index("idx_refresh_token_valid").using("btree", table.valid.asc().nullsLast()),
    index("idx_refresh_token_username").using("btree", sql`lower(${table.username})`),
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
  bookmarks: many(bookmarks),
  comments: many(comments),
  followedSources: many(followedSources),
  loginAttempts: many(loginAttempts),
  loginHistories: many(loginHistory),
  verificationTokens: many(verificationTokens),
}));

export const loginAttemptRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, {
    fields: [loginAttempts.userId],
    references: [users.id],
  }),
}));

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
  }),
}));

export const verificationTokenRelations = relations(verificationTokens, ({ one }) => ({
  user: one(users, {
    fields: [verificationTokens.userId],
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
  comments: many(comments),
  source: one(sources, {
    fields: [articles.sourceId],
    references: [sources.id],
  }),
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
