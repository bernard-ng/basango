import { relations, sql } from "drizzle-orm";
import {
  boolean,
  customType,
  doublePrecision,
  foreignKey,
  index,
  integer,
  jsonb,
  inet,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const tsvector = customType<{
  data: string;
}>({
  dataType() {
    return "tsvector";
  },
});

type NumericConfig = {
  precision?: number;
  scale?: number;
};

export const numericCasted = customType<{
  data: number;
  driverData: string;
  config: NumericConfig;
}>({
  dataType: (config) => {
    if (config?.precision && config?.scale) {
      return `numeric(${config.precision}, ${config.scale})`;
    }
    return "numeric";
  },
  fromDriver: (value: string) => Number.parseFloat(value),
  toDriver: (value: number) => value.toString(),
});

export const articleSentimentEnum = pgEnum("article_sentiment", [
  "positive",
  "neutral",
  "negative",
]);

export const biasEnum = pgEnum("bias", [
  "neutral",
  "slightly",
  "partisan",
  "extreme",
]);

export const reliabilityEnum = pgEnum("reliability", [
  "trusted",
  "reliable",
  "average",
  "low_trust",
  "unreliable",
]);

export const transparencyEnum = pgEnum("transparency", [
  "high",
  "medium",
  "low",
]);

export const verificationTokenPurposeEnum = pgEnum(
  "verification_token_purpose",
  ["confirm_account", "password_reset", "unlock_account", "delete_account"],
);

export const sources = pgTable(
  "source",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    url: varchar("url", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    displayName: varchar("display_name", { length: 255 }),
    description: varchar("description", { length: 1024 }),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }),
    bias: biasEnum("bias").notNull().default("neutral"),
    reliability: reliabilityEnum("reliability").notNull().default("reliable"),
    transparency: transparencyEnum("transparency").notNull().default("medium"),
  },
  (table) => [
    uniqueIndex("unq_source_name").using(
      "btree",
      sql`lower
          (${table.name})`,
    ),
    uniqueIndex("unq_source_url").using(
      "btree",
      sql`lower
          (${table.url})`,
    ),
  ],
);

export const articles = pgTable(
  "article",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    sourceId: uuid("source_id").notNull(),
    title: varchar("title", { length: 1024 }).notNull(),
    body: text("body").notNull(),
    hash: varchar("hash", { length: 32 }).notNull(),
    categories: text("categories").array(),
    sentiment: articleSentimentEnum("sentiment").notNull().default("neutral"),
    metadata: jsonb("metadata"),
    tokenStatistics: jsonb("token_statistics"),
    image: varchar("image", { length: 1024 }).generatedAlwaysAs(
      () => sql`(metadata->>'image')`,
    ),
    excerpt: varchar("excerpt", { length: 255 }).generatedAlwaysAs(
      () => sql`((left(body, 200) || '...'))`,
    ),
    publishedAt: timestamp("published_at", { mode: "string" }).notNull(),
    crawledAt: timestamp("crawled_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }),
    link: varchar("link", { length: 1024 }).notNull(),
    bias: biasEnum("bias").notNull().default("neutral"),
    reliability: reliabilityEnum("reliability").notNull().default("reliable"),
    transparency: transparencyEnum("transparency").notNull().default("medium"),
    readingTime: integer("reading_time").default(1),
    tsv: tsvector("tsv").generatedAlwaysAs(
      () => sql`(
        setweight(to_tsvector('french', coalesce(title, '')), 'A') 
        || setweight(to_tsvector('french', coalesce(body, '')), 'B')
    )`,
    ),
  },
  (table) => [
    index("article_source_id_idx").on(table.sourceId),
    index("idx_article_published_at").using("btree", table.publishedAt.desc()),
    index("idx_article_published_id").using(
      "btree",
      table.publishedAt.desc(),
      table.id.desc(),
    ),
    unique("unq_article_hash").on(table.hash),
    index("gin_article_tsv").using("gin", table.tsv),
    index("gin_article_link_trgm").using("gin", table.link.op("gin_trgm_ops")),
    index("gin_article_title_trgm").using(
      "gin",
      table.title.op("gin_trgm_ops"),
    ),
    index("gin_article_categories").using("gin", table.categories),
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
      name: "article_source_id_fkey",
    }).onDelete("cascade"),
    {
      kind: "check",
      expression: sql`reading_time >= 0`,
      name: "chk_article_reading_time",
    },
    {
      kind: "check",
      expression: sql`(metadata IS NULL OR jsonb_typeof(metadata) IN ('object','array'))`,
      name: "chk_article_metadata_json",
    },
  ],
);

export const users = pgTable(
  "user",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: varchar("password", { length: 512 }).notNull(),
    isLocked: boolean("is_locked").notNull().default(false),
    isConfirmed: boolean("is_confirmed").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }),
    roles: jsonb("roles").notNull(),
  },
  (table) => [
    uniqueIndex("unq_user_email").using("btree", sql`lower (${table.email})`),
    {
      kind: "check",
      name: "chk_user_roles_array",
      expression: sql`jsonb_typeof(roles) = 'array'`,
    },
  ],
);

export const bookmarks = pgTable(
  "bookmark",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    description: varchar("description", { length: 512 }),
    isPublic: boolean("is_public").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }),
  },
  (table) => [
    index("bookmark_user_id_idx").on(table.userId),
    index("idx_bookmark_user_created").using(
      "btree",
      table.userId,
      table.createdAt.desc(),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "bookmark_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const bookmarkArticles = pgTable(
  "bookmark_article",
  {
    bookmarkId: uuid("bookmark_id").notNull(),
    articleId: uuid("article_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.bookmarkId, table.articleId],
      name: "bookmark_article_pkey",
    }),
    index("bookmark_article_bookmark_idx").on(table.bookmarkId),
    index("bookmark_article_article_idx").on(table.articleId),
    foreignKey({
      columns: [table.bookmarkId],
      foreignColumns: [bookmarks.id],
      name: "bookmark_article_bookmark_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [articles.id],
      name: "bookmark_article_article_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const comments = pgTable(
  "comment",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    articleId: uuid("article_id").notNull(),
    content: varchar("content", { length: 512 }).notNull(),
    sentiment: articleSentimentEnum("sentiment").notNull().default("neutral"),
    isSpam: boolean("is_spam").notNull().default(false),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => [
    index("comment_user_id_idx").on(table.userId),
    index("comment_article_id_idx").on(table.articleId),
    index("idx_comment_article_created").using(
      "btree",
      table.articleId,
      table.createdAt.desc(),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "comment_user_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [articles.id],
      name: "comment_article_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const followedSources = pgTable(
  "followed_source",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    followerId: uuid("follower_id").notNull(),
    sourceId: uuid("source_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => [
    index("followed_source_follower_idx").on(table.followerId),
    index("followed_source_source_idx").on(table.sourceId),
    index("idx_followed_source_follower_created").using(
      "btree",
      table.followerId,
      table.createdAt.desc(),
    ),
    foreignKey({
      columns: [table.followerId],
      foreignColumns: [users.id],
      name: "followed_source_follower_id_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [sources.id],
      name: "followed_source_source_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const loginAttempts = pgTable(
  "login_attempt",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => [
    index("login_attempt_user_id_idx").on(table.userId),
    index("idx_login_attempt_created_at").using(
      "btree",
      table.createdAt.desc(),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "login_attempt_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const loginHistories = pgTable(
  "login_history",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    ipAddress: inet("ip_address"),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    deviceOperatingSystem: varchar("device_operating_system", { length: 255 }),
    deviceClient: varchar("device_client", { length: 255 }),
    deviceDevice: varchar("device_device", { length: 255 }),
    deviceIsBot: boolean("device_is_bot").notNull().default(false),
    locationTimeZone: varchar("location_time_zone", { length: 255 }),
    locationLongitude: doublePrecision("location_longitude"),
    locationLatitude: doublePrecision("location_latitude"),
    locationAccuracyRadius: integer("location_accuracy_radius"),
  },
  (table) => [
    index("login_history_user_id_idx").on(table.userId),
    index("idx_login_history_created_at").using(
      "btree",
      table.userId,
      table.createdAt.desc(),
    ),
    index("login_history_ip_address_idx").on(table.ipAddress),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "login_history_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: integer("id")
      .generatedAlwaysAsIdentity({ name: "refresh_tokens_id_seq" })
      .primaryKey(),
    refreshToken: varchar("refresh_token", { length: 128 }).notNull(),
    username: varchar("username", { length: 255 }).notNull(),
    validUntil: timestamp("valid", { mode: "string" }).notNull(),
  },
  (table) => [unique("uniq_refresh_token_token").on(table.refreshToken)],
);

export const verificationTokens = pgTable(
  "verification_token",
  {
    id: uuid("id").notNull().defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    purpose: verificationTokenPurposeEnum("purpose").notNull(),
    token: varchar("token", { length: 60 }),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
  },
  (table) => [
    index("verification_token_user_id_idx").on(table.userId),
    index("idx_verification_token_created_at").using(
      "btree",
      table.createdAt.desc(),
    ),
    uniqueIndex("unq_verification_token_user_purpose")
      .on(table.userId, table.purpose)
      .where(sql`token IS NOT NULL`),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "verification_token_user_id_fkey",
    }).onDelete("cascade"),
  ],
);

// Relations

export const sourcesRelations = relations(sources, ({ many }) => ({
  articles: many(articles),
  followers: many(followedSources),
}));

export const articlesRelations = relations(articles, ({ one, many }) => ({
  source: one(sources, {
    fields: [articles.sourceId],
    references: [sources.id],
  }),
  bookmarkLinks: many(bookmarkArticles),
  comments: many(comments),
}));

export const appUsersRelations = relations(users, ({ many }) => ({
  bookmarks: many(bookmarks),
  comments: many(comments),
  loginAttempts: many(loginAttempts),
  loginHistories: many(loginHistories),
  verificationTokens: many(verificationTokens),
  followedSources: many(followedSources),
}));

export const bookmarksRelations = relations(bookmarks, ({ one, many }) => ({
  user: one(users, {
    fields: [bookmarks.userId],
    references: [users.id],
  }),
  articles: many(bookmarkArticles),
}));

export const bookmarkArticlesRelations = relations(
  bookmarkArticles,
  ({ one }) => ({
    bookmark: one(bookmarks, {
      fields: [bookmarkArticles.bookmarkId],
      references: [bookmarks.id],
    }),
    article: one(articles, {
      fields: [bookmarkArticles.articleId],
      references: [articles.id],
    }),
  }),
);

export const commentsRelations = relations(comments, ({ one }) => ({
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const followedSourcesRelations = relations(
  followedSources,
  ({ one }) => ({
    follower: one(users, {
      fields: [followedSources.followerId],
      references: [users.id],
    }),
    source: one(sources, {
      fields: [followedSources.sourceId],
      references: [sources.id],
    }),
  }),
);

export const loginAttemptsRelations = relations(loginAttempts, ({ one }) => ({
  user: one(users, {
    fields: [loginAttempts.userId],
    references: [users.id],
  }),
}));

export const loginHistoriesRelations = relations(loginHistories, ({ one }) => ({
  user: one(users, {
    fields: [loginHistories.userId],
    references: [users.id],
  }),
}));

export const verificationTokensRelations = relations(
  verificationTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [verificationTokens.userId],
      references: [users.id],
    }),
  }),
);
