CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
SET SESSION TIME ZONE 'UTC';--> statement-breakpoint
CREATE TYPE "public"."bias" AS ENUM('neutral', 'slightly', 'partisan', 'extreme');--> statement-breakpoint
CREATE TYPE "public"."ingestion_agent_state" AS ENUM('idle', 'busy');--> statement-breakpoint
CREATE TYPE "public"."ingestion_run_state" AS ENUM('preparing', 'running', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ingestion_signal_type" AS ENUM('agent.heartbeat', 'agent.reset', 'run.preparing', 'run.started', 'run.progress', 'run.completed', 'run.failed');--> statement-breakpoint
CREATE TYPE "public"."reliability" AS ENUM('trusted', 'reliable', 'average', 'low_trust', 'unreliable');--> statement-breakpoint
CREATE TYPE "public"."sentiment" AS ENUM('positive', 'neutral', 'negative');--> statement-breakpoint
CREATE TYPE "public"."transparency" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TABLE "account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"id_token" text,
	"issuer" text NOT NULL,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article" (
	"body" text NOT NULL,
	"categories" text[],
	"category_id" uuid,
	"clustered" boolean DEFAULT false NOT NULL,
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
	"tsv" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('french'::regconfig, COALESCE(title, '')::text), 'A'::"char")) STORED,
	"updated_at" timestamp,
	CONSTRAINT "chk_article_reading_time" CHECK ((reading_time >= 0)),
	CONSTRAINT "chk_article_sentiment" CHECK (((sentiment)::text = ANY (ARRAY['positive'::text,'neutral'::text,'negative'::text]))),
	CONSTRAINT "chk_article_metadata_json" CHECK (((metadata IS NULL) OR (jsonb_typeof(metadata) IN ('object'::text,'array'::text))))
);
--> statement-breakpoint
CREATE TABLE "bookmark_article" (
	"article_id" uuid NOT NULL,
	"bookmark_id" uuid NOT NULL,
	CONSTRAINT "bookmark_article_pkey" PRIMARY KEY("bookmark_id","article_id")
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
CREATE TABLE "category" (
	"candidates" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"description" varchar(512),
	"embeddings" jsonb,
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(255) NOT NULL,
	"updated_at" timestamp,
	"weight" integer DEFAULT 0 NOT NULL
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
CREATE TABLE "ingestion_activity" (
	"agent_id" varchar(255) NOT NULL,
	"data" jsonb NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"occurred_at" timestamp NOT NULL,
	"run_id" uuid,
	"source_id" varchar(255),
	"type" "ingestion_signal_type" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_agent" (
	"active_run_id" uuid,
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"last_seen_at" timestamp NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"state" "ingestion_agent_state" DEFAULT 'idle' NOT NULL,
	"version" varchar(64)
);
--> statement-breakpoint
CREATE TABLE "ingestion_run" (
	"agent_id" varchar(255) NOT NULL,
	"articles_delivered" integer DEFAULT 0 NOT NULL,
	"articles_discovered" integer DEFAULT 0 NOT NULL,
	"articles_failed" integer DEFAULT 0 NOT NULL,
	"articles_persisted" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp NOT NULL,
	"duration_ms" bigint,
	"error" text,
	"id" uuid PRIMARY KEY NOT NULL,
	"last_signal_at" timestamp NOT NULL,
	"source_id" varchar(255) NOT NULL,
	"started_at" timestamp,
	"state" "ingestion_run_state" NOT NULL,
	CONSTRAINT "chk_ingestion_run_metrics_nonnegative" CHECK ("ingestion_run"."articles_delivered" >= 0 AND "ingestion_run"."articles_discovered" >= 0 AND "ingestion_run"."articles_failed" >= 0 AND "ingestion_run"."articles_persisted" >= 0),
	CONSTRAINT "chk_ingestion_run_duration_nonnegative" CHECK ("ingestion_run"."duration_ms" IS NULL OR "ingestion_run"."duration_ms" >= 0)
);
--> statement-breakpoint
CREATE TABLE "session" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"impersonated_by" text,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_agent" text,
	"user_id" uuid NOT NULL
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
	"ban_expires" timestamp,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"image" text,
	"name" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" uuid PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "fk_account_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "fk_article_category_id" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "fk_article_source_id" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_article" ADD CONSTRAINT "fk_bookmark_article_bookmark_id" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmark"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_article" ADD CONSTRAINT "fk_bookmark_article_article_id" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "fk_bookmark_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "fk_comment_article_id" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followed_source" ADD CONSTRAINT "fk_followed_source_follower_id" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followed_source" ADD CONSTRAINT "fk_followed_source_source_id" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "fk_session_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_account_issuer_account_id" ON "account" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "idx_account_user_id" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "gin_article_categories" ON "article" USING gin ("categories" array_ops);--> statement-breakpoint
CREATE INDEX "idx_article_category_id" ON "article" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_article_clustered" ON "article" USING btree ("clustered");--> statement-breakpoint
CREATE INDEX "gin_article_link_trgm" ON "article" USING gin ("link" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "gin_article_title_trgm" ON "article" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "gin_article_tsv" ON "article" USING gin ("tsv" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_article_source_published_id" ON "article" USING btree ("source_id","published_at" DESC NULLS FIRST,"id" DESC NULLS FIRST);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_article_hash" ON "article" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "idx_bookmark_article_bookmark_id" ON "bookmark_article" USING btree ("bookmark_id");--> statement-breakpoint
CREATE INDEX "idx_bookmark_user_created" ON "bookmark" USING btree ("user_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_bookmark_user_name" ON "bookmark" USING btree ("user_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "unq_category_name" ON "category" USING btree (lower((name)::text));--> statement-breakpoint
CREATE UNIQUE INDEX "unq_category_slug" ON "category" USING btree (lower((slug)::text));--> statement-breakpoint
CREATE INDEX "idx_category_weight" ON "category" USING btree ("weight");--> statement-breakpoint
CREATE INDEX "idx_comment_article_id" ON "comment" USING btree ("article_id");--> statement-breakpoint
CREATE INDEX "idx_comment_user_id" ON "comment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_comment_article_created" ON "comment" USING btree ("article_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE INDEX "idx_followed_source_source_id" ON "followed_source" USING btree ("source_id");--> statement-breakpoint
CREATE INDEX "idx_followed_source_follower_id" ON "followed_source" USING btree ("follower_id");--> statement-breakpoint
CREATE INDEX "idx_followed_source_follower_created" ON "followed_source" USING btree ("follower_id","created_at" DESC NULLS FIRST);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_followed_source_user_source" ON "followed_source" USING btree ("follower_id","source_id");--> statement-breakpoint
CREATE INDEX "idx_ingestion_activity_occurred" ON "ingestion_activity" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "idx_ingestion_activity_run_occurred" ON "ingestion_activity" USING btree ("run_id","occurred_at");--> statement-breakpoint
CREATE INDEX "idx_ingestion_agent_last_seen" ON "ingestion_agent" USING btree ("last_seen_at");--> statement-breakpoint
CREATE INDEX "idx_ingestion_run_last_signal" ON "ingestion_run" USING btree ("last_signal_at");--> statement-breakpoint
CREATE INDEX "idx_ingestion_run_agent_state" ON "ingestion_run" USING btree ("agent_id","state");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_session_token" ON "session" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_session_user_id" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unq_source_name" ON "source" USING btree (lower((name)::text));--> statement-breakpoint
CREATE UNIQUE INDEX "unq_source_url" ON "source" USING btree (lower((url)::text));--> statement-breakpoint
CREATE UNIQUE INDEX "unq_user_email" ON "user" USING btree (lower((email)::text));--> statement-breakpoint
CREATE INDEX "idx_user_created_at" ON "user" USING btree (created_at);--> statement-breakpoint
CREATE INDEX "idx_verification_identifier" ON "verification" USING btree ("identifier");
