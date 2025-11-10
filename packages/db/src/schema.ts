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

export const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return "tsvector";
  },
});

export const customJsonType = <T>() =>
  customType<{ data: T }>({
    dataType() {
      return "jsonb";
    },
    fromDriver(value) {
      return value as T;
    },
    toDriver(value) {
      return value; // JSONB → just pass the object
    },
  });

export const biasEnum = pgEnum("bias", ["neutral", "slightly", "partisan", "extreme"]);
export const reliabilityEnum = pgEnum("reliability", [
  "trusted",
  "reliable",
  "average",
  "low_trust",
  "unreliable",
]);
export const sentimentEnum = pgEnum("sentiment", ["positive", "neutral", "negative"]);
export const transparencyEnum = pgEnum("transparency", ["high", "medium", "low"]);
export const tokenPurposeEnum = pgEnum("token_purpose", [
  "confirm_account",
  "password_reset",
  "unlock_account",
  "delete_account",
]);

export type EmailAddress = string;
export type Link = string;
export type ReadingTime = number;

export type Role = "ROLE_USER" | "ROLE_ADMIN";
export type Roles = Role[];

export type Bias = (typeof biasEnum.enumValues)[number];
export type Reliability = (typeof reliabilityEnum.enumValues)[number];
export type Sentiment = (typeof sentimentEnum.enumValues)[number];
export type Transparency = (typeof transparencyEnum.enumValues)[number];
export type TokenPurpose = (typeof tokenPurposeEnum.enumValues)[number];

export type Credibility = {
  bias: Bias;
  reliability: Reliability;
  transparency: Transparency;
};

export type TokenStatistics = {
  title: number;
  body: number;
  categories: number;
  excerpt: number;
  total: number;
};

export type Device = {
  operatingSystem?: string;
  client?: string;
  device?: string;
  isBot: boolean;
};

export type GeoLocation = {
  country?: string;
  city?: string;
  timeZone?: string;
  longitude?: number;
  latitude?: number;
  accuracyRadius?: number;
};

export type ArticleMetadata = {
  title?: string;
  description?: string;
  image?: string;
};

export type DateRange = {
  start: number; // unix timestamp (seconds)
  end: number; // unix timestamp (seconds)
};

// Secrets
export type GeneratedToken = string;
export type GeneratedCode = string;

/* -------------------------------------------------------------------------- */
/*                                   Tables                                   */
/* -------------------------------------------------------------------------- */

export const user = pgTable(
  "user",
  {
    createdAt: timestamp("created_at").defaultNow().notNull(),
    email: varchar({ length: 255 }).$type<EmailAddress>().notNull(),
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

export const source = pgTable(
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

export const article = pgTable(
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
      sql`(
        setweight(to_tsvector('french'::regconfig, COALESCE(title, '')::text), 'A'::"char")
        || setweight(to_tsvector('french'::regconfig, COALESCE(body,  ''::text)), 'B'::"char")
      )`,
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
      foreignColumns: [source.id],
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

export const bookmark = pgTable(
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
      foreignColumns: [user.id],
      name: "fk_bookmark_user_id",
    }).onDelete("cascade"),
  ],
);

export const bookmarkArticle = pgTable(
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
      foreignColumns: [bookmark.id],
      name: "fk_bookmark_article_bookmark_id",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [article.id],
      name: "fk_bookmark_article_article_id",
    }).onDelete("cascade"),
  ],
);

export const loginAttempt = pgTable(
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
      foreignColumns: [user.id],
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
      foreignColumns: [user.id],
      name: "fk_login_history_user_id",
    }).onDelete("cascade"),
  ],
);

export const verificationToken = pgTable(
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
      foreignColumns: [user.id],
      name: "fk_verification_token_user_id",
    }).onDelete("cascade"),
  ],
);

export const followedSource = pgTable(
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
      foreignColumns: [user.id],
      name: "fk_followed_source_follower_id",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.sourceId],
      foreignColumns: [source.id],
      name: "fk_followed_source_source_id",
    }).onDelete("cascade"),
  ],
);

export const comment = pgTable(
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
      foreignColumns: [user.id],
      name: "fk_comment_user_id",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.articleId],
      foreignColumns: [article.id],
      name: "fk_comment_article_id",
    }).onDelete("cascade"),
  ],
);

export const refreshToken = pgTable(
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
