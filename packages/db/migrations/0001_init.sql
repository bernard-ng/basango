CREATE TYPE "public"."bias" AS ENUM('neutral', 'slightly', 'partisan', 'extreme');--> statement-breakpoint
CREATE TYPE "public"."reliability" AS ENUM('trusted', 'reliable', 'average', 'low_trust', 'unreliable');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."token_purpose" AS ENUM('confirm_account', 'password_reset', 'unlock_account', 'delete_account');--> statement-breakpoint
CREATE TYPE "public"."transparency" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TABLE "article" (
	"body" text NOT NULL,
	"categories" text[],
	"crawled_at" timestamp DEFAULT now() NOT NULL,
	"credibility" jsonb,
	"excerpt" varchar(255) GENERATED ALWAYS AS (("left"(body, 200) || '...'::text)) STORED,
	"hash" varchar(32) NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"image" varchar(1024) GENERATED ALWAYS AS ((metadata ->> 'image'::text)) STORED,
	"link" varchar(1024) NOT NULL,
	"metadata" jsonb,
	"published_at" timestamp NOT NULL,
	"reading_time" integer DEFAULT 1,
	"sentiment" "sentiment" NOT NULL,
	"source_id" uuid NOT NULL,
	"title" varchar(1024) NOT NULL,
	"token_statistics" jsonb,
	"tsv" "tsvector" GENERATED ALWAYS AS ((
        setweight(to_tsvector('french'::regconfig, COALESCE(title, '')::text), 'A'::"char")
        || setweight(to_tsvector('french'::regconfig, COALESCE(body,  ''::text)), 'B'::"char")
      )) STORED,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "bookmark" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"description" varchar(512),
	"id" uuid PRIMARY KEY NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"name" varchar(255) NOT NULL,
	"updated_at" timestamp,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmark_article" (
	"article_id" uuid NOT NULL,
	"bookmark_id" uuid NOT NULL,
	CONSTRAINT "bookmark_article_pkey" PRIMARY KEY("bookmark_id","article_id")
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"article_id" uuid NOT NULL,
	"content" varchar(512) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"sentiment" "sentiment" NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "followed_source" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"follower_id" uuid NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempt" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_history" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"device" jsonb,
	"id" uuid PRIMARY KEY NOT NULL,
	"ip_address" "inet",
	"location" jsonb,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_token" (
	"id" uuid PRIMARY KEY NOT NULL,
	"token" varchar(128) NOT NULL,
	"username" varchar(255) NOT NULL,
	"valid" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "source" (
	"credibility" jsonb,
	"description" varchar(1024),
	"display_name" varchar(255),
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"updated_at" timestamp,
	"url" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" varchar(255) NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"name" varchar(255) NOT NULL,
	"password" varchar(512) NOT NULL,
	"roles" varchar(255)[] DEFAULT '{"ROLE_USER"}' NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"purpose" "token_purpose" NOT NULL,
	"token" varchar(60),
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "fk_article_source_id" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "fk_bookmark_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_article" ADD CONSTRAINT "fk_bookmark_article_bookmark_id" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmark"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_article" ADD CONSTRAINT "fk_bookmark_article_article_id" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_article_id" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followed_source" ADD CONSTRAINT "fk_followed_source_follower_id" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followed_source" ADD CONSTRAINT "fk_followed_source_source_id" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_attempt" ADD CONSTRAINT "fk_login_attempt_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "fk_login_history_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_token" ADD CONSTRAINT "fk_verification_token_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gin_article_categories" ON "article" USING gin ("categories" array_ops);--> statement-breakpoint
CREATE INDEX "gin_article_link_trgm" ON "article" USING gin ("link" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "gin_article_title_trgm" ON "article" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "gin_article_tsv" ON "article" USING gin ("tsv" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_article_source_published_id" ON "article" USING btree ("source_id","published_at" DESC NULLS FIRST,"id" DESC NULLS FIRST);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_article_hash" ON "article" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "idx_bookmark_user_created" ON "bookmark" USING btree ("user_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_bookmark_user_name" ON "bookmark" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE INDEX "idx_bookmark_article_bookmark_id" ON "bookmark_article" USING btree ("bookmark_id");--> statement-breakpoint
CREATE INDEX "idx_comment_article_id" ON "comment" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_comment_user_id" ON "comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_comment_article_created" ON "comment" USING btree ("article_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_followed_source_source_id" ON "followed_source" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_followed_source_follower_id" ON "followed_source" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "idx_followed_source_follower_created" ON "followed_source" USING btree ("follower_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_followed_source_user_source" ON "followed_source" USING btree ("follower_id","source_id");--> statement-breakpoint
CREATE INDEX "idx_login_attempt_user_created" ON "login_attempt" USING btree ("user_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_login_history_user_created" ON "login_history" USING btree ("user_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_login_history_ip_address" ON "login_history" USING btree ("ip_address");--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_refresh_token_token" ON "refresh_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_refresh_token_valid" ON "refresh_token" USING btree ("valid");--> statement-breakpoint
CREATE INDEX "idx_refresh_token_username" ON "refresh_token" USING btree (lower("username"));--> statement-breakpoint
CREATE UNIQUE INDEX "unq_source_name" ON "source" USING btree (lower((name)::text));--> statement-breakpoint
CREATE UNIQUE INDEX "unq_source_url" ON "source" USING btree (lower((url)::text));--> statement-breakpoint
CREATE UNIQUE INDEX "unq_user_email" ON "user" USING btree (lower((email)::text));--> statement-breakpoint
CREATE INDEX "idx_user_created_at" ON "user" USING btree (created_at);--> statement-breakpoint
CREATE INDEX "idx_verif_token_created_at" ON "verification_token" USING btree ("created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_verif_user_purpose_token" ON "verification_token" USING btree ("user_id","purpose","token") WHERE "verification_token"."token" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_verif_token_token" ON "verification_token" USING btree ("token") WHERE "verification_token"."token" IS NOT NULL;