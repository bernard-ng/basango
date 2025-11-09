import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  customType,
  doublePrecision,
  foreignKey,
  index,
  inet,
  integer,
  jsonb,
  pgSequence,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

export const refreshTokensIdSeq = pgSequence("refresh_tokens_id_seq", {
  cache: "1",
  cycle: false,
  increment: "1",
  maxValue: "9223372036854775807",
  minValue: "1",
  startWith: "1",
});

// legacy table for doctrine migrations
export const doctrineMigrationVersions = pgTable("doctrine_migration_versions", {
  executedAt: timestamp("executed_at", { mode: "string" }).default(sql`NULL`),
  executionTime: integer("execution_time"),
  version: varchar({ length: 191 }).primaryKey().notNull(),
});

export const bookmark = pgTable(
  "bookmark",
  {
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    description: varchar({ length: 512 }).default(sql`NULL`),
    id: uuid().primaryKey().notNull(),
    isPublic: boolean("is_public").default(false).notNull(),
    name: varchar({ length: 255 }).notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(sql`NULL`),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_bookmark_user_created").using(
      "btree",
      table.userId.asc().nullsLast().op("timestamp_ops"),
      table.createdAt.desc().nullsFirst().op("timestamp_ops"),
    ),
    index("idx_da62921da76ed395").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "fk_da62921da76ed395",
    }).onDelete("cascade"),
  ],
);

export const loginAttempt = pgTable(
  "login_attempt",
  {
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    id: uuid().primaryKey().notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_8c11c1ba76ed395").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
    index("idx_login_attempt_created_at").using(
      "btree",
      table.createdAt.desc().nullsFirst().op("timestamp_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "fk_8c11c1ba76ed395",
    }).onDelete("cascade"),
  ],
);

export const loginHistory = pgTable(
  "login_history",
  {
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    deviceClient: varchar("device_client", { length: 255 }).default(sql`NULL`),
    deviceDevice: varchar("device_device", { length: 255 }).default(sql`NULL`),
    deviceIsBot: boolean("device_is_bot").default(false).notNull(),
    deviceOperatingSystem: varchar("device_operating_system", { length: 255 }).default(sql`NULL`),
    id: uuid().primaryKey().notNull(),
    ipAddress: inet("ip_address"),
    locationAccuracyRadius: integer("location_accuracy_radius"),
    locationLatitude: doublePrecision("location_latitude"),
    locationLongitude: doublePrecision("location_longitude"),
    locationTimeZone: varchar("location_time_zone", { length: 255 }).default(sql`NULL`),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_37976e36a76ed395").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
    index("idx_login_history_created_at").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops"),
      table.createdAt.desc().nullsFirst().op("timestamp_ops"),
    ),
    index("idx_login_history_ip_address").using(
      "btree",
      table.ipAddress.asc().nullsLast().op("inet_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "fk_37976e36a76ed395",
    }).onDelete("cascade"),
  ],
);

export const verificationToken = pgTable(
  "verification_token",
  {
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    id: uuid().primaryKey().notNull(),
    purpose: varchar({ length: 255 }).notNull(),
    token: varchar({ length: 60 }).default(sql`NULL`),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_c1cc006ba76ed395").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
    index("idx_verif_token_created_at").using(
      "btree",
      table.createdAt.desc().nullsFirst().op("timestamp_ops"),
    ),
    uniqueIndex("unq_verif_user_purpose_token")
      .using(
        "btree",
        table.userId.asc().nullsLast().op("text_ops"),
        table.purpose.asc().nullsLast().op("text_ops"),
      )
      .where(sql`(token IS NOT NULL)`),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "fk_c1cc006ba76ed395",
    }).onDelete("cascade"),
  ],
);

export const followedSource = pgTable(
  "followed_source",
  {
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    followerId: uuid("follower_id").notNull(),
    id: uuid().primaryKey().notNull(),
    sourceId: uuid("source_id").notNull(),
  },
  (table) => [
    index("idx_7a763a3e953c1c61").using("btree", table.sourceId.asc().nullsLast().op("uuid_ops")),
    index("idx_7a763a3eac24f853").using("btree", table.followerId.asc().nullsLast().op("uuid_ops")),
    index("idx_followed_source_follower_created").using(
      "btree",
      table.followerId.asc().nullsLast().op("timestamp_ops"),
      table.createdAt.desc().nullsFirst().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.followerId],
      foreignColumns: [user.id],
      name: "fk_7a763a3eac24f853",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [source.id],
      name: "fk_7a763a3e953c1c61",
    }).onDelete("cascade"),
  ],
);

export const comment = pgTable(
  "comment",
  {
    articleId: uuid("article_id").notNull(),
    content: varchar({ length: 512 }).notNull(),
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    id: uuid().primaryKey().notNull(),
    isSpam: boolean("is_spam").default(false).notNull(),
    sentiment: varchar({ length: 30 }).default("neutral").notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    index("idx_9474526c7294869c").using("btree", table.articleId.asc().nullsLast().op("uuid_ops")),
    index("idx_9474526ca76ed395").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
    index("idx_comment_article_created").using(
      "btree",
      table.articleId.asc().nullsLast().op("timestamp_ops"),
      table.createdAt.desc().nullsFirst().op("uuid_ops"),
    ),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [user.id],
      name: "fk_9474526ca76ed395",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [article.id],
      name: "fk_9474526c7294869c",
    }).onDelete("cascade"),
  ],
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: integer().primaryKey().notNull(),
    refreshToken: varchar("refresh_token", { length: 128 }).notNull(),
    username: varchar({ length: 255 }).notNull(),
    valid: timestamp({ mode: "string" }).notNull(),
  },
  (table) => [
    uniqueIndex("uniq_9bace7e1c74f2195").using(
      "btree",
      table.refreshToken.asc().nullsLast().op("text_ops"),
    ),
  ],
);

export const article = pgTable(
  "article",
  {
    bias: varchar({ length: 30 }).default("neutral").notNull(),
    body: text().notNull(),
    categories: text().array(),
    crawledAt: timestamp("crawled_at", { mode: "string" }).notNull(),
    excerpt: varchar({ length: 255 }).generatedAlwaysAs(sql`("left"(body, 200) || '...'::text)`),
    hash: varchar({ length: 32 }).notNull(),
    id: uuid().primaryKey().notNull(),
    image: varchar({ length: 1024 }).generatedAlwaysAs(sql`(metadata ->> 'image'::text)`),
    link: varchar({ length: 1024 }).notNull(),
    metadata: jsonb(),
    publishedAt: timestamp("published_at", { mode: "string" }).notNull(),
    readingTime: integer("reading_time").default(1),
    reliability: varchar({ length: 30 }).default("reliable").notNull(),
    sentiment: varchar({ length: 30 }).default("neutral").notNull(),
    sourceId: uuid("source_id").notNull(),
    title: varchar({ length: 1024 }).notNull(),
    tokenStatistics: jsonb("token_statistics"),
    transparency: varchar({ length: 30 }).default("medium").notNull(),
    tsv: tsvector("tsv").generatedAlwaysAs(
      sql`(setweight(to_tsvector('french'::regconfig, (COALESCE(title, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('french'::regconfig, COALESCE(body, ''::text)), 'B'::"char"))`,
    ),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(sql`NULL`),
  },
  (table) => [
    index("gin_article_categories").using(
      "gin",
      table.categories.asc().nullsLast().op("array_ops"),
    ),
    index("gin_article_link_trgm").using("gin", table.link.asc().nullsLast().op("gin_trgm_ops")),
    index("gin_article_title_trgm").using("gin", table.title.asc().nullsLast().op("gin_trgm_ops")),
    index("gin_article_tsv").using("gin", table.tsv.asc().nullsLast().op("tsvector_ops")),
    index("idx_23a0e66953c1c61").using("btree", table.sourceId.asc().nullsLast().op("uuid_ops")),
    index("idx_article_published_at").using(
      "btree",
      table.publishedAt.desc().nullsFirst().op("timestamp_ops"),
    ),
    index("idx_article_published_id").using(
      "btree",
      table.publishedAt.desc().nullsFirst().op("timestamp_ops"),
      table.id.desc().nullsFirst().op("uuid_ops"),
    ),
    uniqueIndex("unq_article_hash").using("btree", table.hash.asc().nullsLast().op("text_ops")),
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [source.id],
      name: "fk_23a0e66953c1c61",
    }).onDelete("cascade"),
    check("chk_article_reading_time", sql`reading_time >= 0`),
    check(
      "chk_article_sentiment",
      sql`(sentiment)::text = ANY ((ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying])::text[])`,
    ),
    check(
      "chk_article_metadata_json",
      sql`(metadata IS NULL) OR (jsonb_typeof(metadata) = ANY (ARRAY['object'::text, 'array'::text]))`,
    ),
  ],
);

export const user = pgTable(
  "user",
  {
    createdAt: timestamp("created_at", { mode: "string" }).notNull(),
    email: varchar({ length: 255 }).notNull(),
    id: uuid().primaryKey().notNull(),
    isConfirmed: boolean("is_confirmed").default(false).notNull(),
    isLocked: boolean("is_locked").default(false).notNull(),
    name: varchar({ length: 255 }).notNull(),
    password: varchar({ length: 512 }).notNull(),
    roles: jsonb().notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(sql`NULL`),
  },
  (_table) => [
    uniqueIndex("unq_user_email").using("btree", sql`lower((email)::text)`),
    check("chk_user_roles_json", sql`jsonb_typeof(roles) = 'array'::text`),
  ],
);

export const source = pgTable(
  "source",
  {
    bias: varchar({ length: 30 }).default("neutral").notNull(),
    description: varchar({ length: 1024 }).default(sql`NULL`),
    displayName: varchar("display_name", { length: 255 }).default(sql`NULL`),
    id: uuid().primaryKey().notNull(),
    name: varchar({ length: 255 }).notNull(),
    reliability: varchar({ length: 30 }).default("reliable").notNull(),
    transparency: varchar({ length: 30 }).default("medium").notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" }).default(sql`NULL`),
    url: varchar({ length: 255 }).notNull(),
  },
  (_table) => [
    uniqueIndex("unq_source_name").using("btree", sql`lower((name)::text)`),
    uniqueIndex("unq_source_url").using("btree", sql`lower((url)::text)`),
  ],
);

export const bookmarkArticle = pgTable(
  "bookmark_article",
  {
    articleId: uuid("article_id").notNull(),
    bookmarkId: uuid("bookmark_id").notNull(),
  },
  (table) => [
    index("idx_6fe2655d7294869c").using("btree", table.articleId.asc().nullsLast().op("uuid_ops")),
    index("idx_6fe2655d92741d25").using("btree", table.bookmarkId.asc().nullsLast().op("uuid_ops")),
    foreignKey({
      columns: [table.bookmarkId],
      foreignColumns: [bookmark.id],
      name: "fk_6fe2655d92741d25",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [article.id],
      name: "fk_6fe2655d7294869c",
    }).onDelete("cascade"),
    primaryKey({ columns: [table.bookmarkId, table.articleId], name: "bookmark_article_pkey" }),
  ],
);

export const bookmarkRelations = relations(bookmark, ({ one, many }) => ({
  bookmarkArticles: many(bookmarkArticle),
  user: one(user, {
    fields: [bookmark.userId],
    references: [user.id],
  }),
}));

export const userRelations = relations(user, ({ many }) => ({
  bookmarks: many(bookmark),
  comments: many(comment),
  followedSources: many(followedSource),
  loginAttempts: many(loginAttempt),
  loginHistories: many(loginHistory),
  verificationTokens: many(verificationToken),
}));

export const loginAttemptRelations = relations(loginAttempt, ({ one }) => ({
  user: one(user, {
    fields: [loginAttempt.userId],
    references: [user.id],
  }),
}));

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(user, {
    fields: [loginHistory.userId],
    references: [user.id],
  }),
}));

export const verificationTokenRelations = relations(verificationToken, ({ one }) => ({
  user: one(user, {
    fields: [verificationToken.userId],
    references: [user.id],
  }),
}));

export const followedSourceRelations = relations(followedSource, ({ one }) => ({
  source: one(source, {
    fields: [followedSource.sourceId],
    references: [source.id],
  }),
  user: one(user, {
    fields: [followedSource.followerId],
    references: [user.id],
  }),
}));

export const sourceRelations = relations(source, ({ many }) => ({
  articles: many(article),
  followedSources: many(followedSource),
}));

export const commentRelations = relations(comment, ({ one }) => ({
  article: one(article, {
    fields: [comment.articleId],
    references: [article.id],
  }),
  user: one(user, {
    fields: [comment.userId],
    references: [user.id],
  }),
}));

export const articleRelations = relations(article, ({ one, many }) => ({
  bookmarkArticles: many(bookmarkArticle),
  comments: many(comment),
  source: one(source, {
    fields: [article.sourceId],
    references: [source.id],
  }),
}));

export const bookmarkArticleRelations = relations(bookmarkArticle, ({ one }) => ({
  article: one(article, {
    fields: [bookmarkArticle.articleId],
    references: [article.id],
  }),
  bookmark: one(bookmark, {
    fields: [bookmarkArticle.bookmarkId],
    references: [bookmark.id],
  }),
}));
