-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE SEQUENCE "public"."refresh_tokens_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "doctrine_migration_versions" (
	"version" varchar(191) PRIMARY KEY NOT NULL,
	"executed_at" timestamp(0) DEFAULT NULL,
	"execution_time" integer
);
--> statement-breakpoint
CREATE TABLE "bookmark" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" varchar(512) DEFAULT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(0) NOT NULL,
	"updated_at" timestamp(0) DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "login_attempt" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp(0) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "login_history" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"ip_address" "inet",
	"created_at" timestamp(0) NOT NULL,
	"device_operating_system" varchar(255) DEFAULT NULL,
	"device_client" varchar(255) DEFAULT NULL,
	"device_device" varchar(255) DEFAULT NULL,
	"device_is_bot" boolean DEFAULT false NOT NULL,
	"location_time_zone" varchar(255) DEFAULT NULL,
	"location_longitude" double precision,
	"location_latitude" double precision,
	"location_accuracy_radius" integer
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" varchar(255) NOT NULL,
	"created_at" timestamp(0) NOT NULL,
	"token" varchar(60) DEFAULT NULL
);
--> statement-breakpoint
CREATE TABLE "followed_source" (
	"id" uuid PRIMARY KEY NOT NULL,
	"follower_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"created_at" timestamp(0) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comment" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	"content" varchar(512) NOT NULL,
	"sentiment" varchar(30) DEFAULT 'neutral' NOT NULL,
	"is_spam" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(0) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" integer PRIMARY KEY NOT NULL,
	"refresh_token" varchar(128) NOT NULL,
	"username" varchar(255) NOT NULL,
	"valid" timestamp(0) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "article" (
	"id" uuid PRIMARY KEY NOT NULL,
	"source_id" uuid NOT NULL,
	"title" varchar(1024) NOT NULL,
	"body" text NOT NULL,
	"hash" varchar(32) NOT NULL,
	"categories" text[],
	"sentiment" varchar(30) DEFAULT 'neutral' NOT NULL,
	"metadata" jsonb,
	"image" varchar(1024) GENERATED ALWAYS AS ((metadata ->> 'image'::text)) STORED,
	"excerpt" varchar(255) GENERATED ALWAYS AS (("left"(body, 200) || '...'::text)) STORED,
	"published_at" timestamp(0) NOT NULL,
	"crawled_at" timestamp(0) NOT NULL,
	"updated_at" timestamp(0) DEFAULT NULL,
	"link" varchar(1024) NOT NULL,
	"bias" varchar(30) DEFAULT 'neutral' NOT NULL,
	"reliability" varchar(30) DEFAULT 'reliable' NOT NULL,
	"transparency" varchar(30) DEFAULT 'medium' NOT NULL,
	"reading_time" integer DEFAULT 1,
	"tsv" "tsvector" GENERATED ALWAYS AS ((setweight(to_tsvector('french'::regconfig, (COALESCE(title, ''::character varying))::text), 'A'::"char") || setweight(to_tsvector('french'::regconfig, COALESCE(body, ''::text)), 'B'::"char"))) STORED,
	"token_statistics" jsonb,
	CONSTRAINT "chk_article_reading_time" CHECK (reading_time >= 0),
	CONSTRAINT "chk_article_sentiment" CHECK ((sentiment)::text = ANY ((ARRAY['positive'::character varying, 'neutral'::character varying, 'negative'::character varying])::text[])),
	CONSTRAINT "chk_article_metadata_json" CHECK ((metadata IS NULL) OR (jsonb_typeof(metadata) = ANY (ARRAY['object'::text, 'array'::text])))
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" varchar(512) NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"is_confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp(0) NOT NULL,
	"updated_at" timestamp(0) DEFAULT NULL,
	"roles" jsonb NOT NULL,
	CONSTRAINT "chk_user_roles_json" CHECK (jsonb_typeof(roles) = 'array'::text)
);
--> statement-breakpoint
CREATE TABLE "source" (
	"id" uuid PRIMARY KEY NOT NULL,
	"url" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"display_name" varchar(255) DEFAULT NULL,
	"description" varchar(1024) DEFAULT NULL,
	"updated_at" timestamp(0) DEFAULT NULL,
	"bias" varchar(30) DEFAULT 'neutral' NOT NULL,
	"reliability" varchar(30) DEFAULT 'reliable' NOT NULL,
	"transparency" varchar(30) DEFAULT 'medium' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookmark_article" (
	"bookmark_id" uuid NOT NULL,
	"article_id" uuid NOT NULL,
	CONSTRAINT "bookmark_article_pkey" PRIMARY KEY("bookmark_id","article_id")
);
--> statement-breakpoint
ALTER TABLE "bookmark" ADD CONSTRAINT "fk_da62921da76ed395" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_attempt" ADD CONSTRAINT "fk_8c11c1ba76ed395" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "login_history" ADD CONSTRAINT "fk_37976e36a76ed395" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_token" ADD CONSTRAINT "fk_c1cc006ba76ed395" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followed_source" ADD CONSTRAINT "fk_7a763a3eac24f853" FOREIGN KEY ("follower_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "followed_source" ADD CONSTRAINT "fk_7a763a3e953c1c61" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "fk_9474526ca76ed395" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment" ADD CONSTRAINT "fk_9474526c7294869c" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "fk_23a0e66953c1c61" FOREIGN KEY ("source_id") REFERENCES "public"."source"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_article" ADD CONSTRAINT "fk_6fe2655d92741d25" FOREIGN KEY ("bookmark_id") REFERENCES "public"."bookmark"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookmark_article" ADD CONSTRAINT "fk_6fe2655d7294869c" FOREIGN KEY ("article_id") REFERENCES "public"."article"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_bookmark_user_created" ON "bookmark" USING btree ("user_id" timestamp_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_da62921da76ed395" ON "bookmark" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_8c11c1ba76ed395" ON "login_attempt" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_login_attempt_created_at" ON "login_attempt" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_37976e36a76ed395" ON "login_history" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_login_history_created_at" ON "login_history" USING btree ("user_id" uuid_ops,"created_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_login_history_ip_address" ON "login_history" USING btree ("ip_address" inet_ops);--> statement-breakpoint
CREATE INDEX "idx_c1cc006ba76ed395" ON "verification_token" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_verif_token_created_at" ON "verification_token" USING btree ("created_at" timestamp_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_verif_user_purpose_token" ON "verification_token" USING btree ("user_id" text_ops,"purpose" text_ops) WHERE (token IS NOT NULL);--> statement-breakpoint
CREATE INDEX "idx_7a763a3e953c1c61" ON "followed_source" USING btree ("source_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_7a763a3eac24f853" ON "followed_source" USING btree ("follower_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_followed_source_follower_created" ON "followed_source" USING btree ("follower_id" timestamp_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_9474526c7294869c" ON "comment" USING btree ("article_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_9474526ca76ed395" ON "comment" USING btree ("user_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_comment_article_created" ON "comment" USING btree ("article_id" timestamp_ops,"created_at" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "uniq_9bace7e1c74f2195" ON "refresh_tokens" USING btree ("refresh_token" text_ops);--> statement-breakpoint
CREATE INDEX "gin_article_categories" ON "article" USING gin ("categories" array_ops);--> statement-breakpoint
CREATE INDEX "gin_article_link_trgm" ON "article" USING gin ("link" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "gin_article_title_trgm" ON "article" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX "gin_article_tsv" ON "article" USING gin ("tsv" tsvector_ops);--> statement-breakpoint
CREATE INDEX "idx_23a0e66953c1c61" ON "article" USING btree ("source_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_article_published_at" ON "article" USING btree ("published_at" timestamp_ops);--> statement-breakpoint
CREATE INDEX "idx_article_published_id" ON "article" USING btree ("published_at" timestamp_ops,"id" uuid_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_article_hash" ON "article" USING btree ("hash" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_user_email" ON "user" USING btree (lower((email)::text) text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_source_name" ON "source" USING btree (lower((name)::text) text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "unq_source_url" ON "source" USING btree (lower((url)::text) text_ops);--> statement-breakpoint
CREATE INDEX "idx_6fe2655d7294869c" ON "bookmark_article" USING btree ("article_id" uuid_ops);--> statement-breakpoint
CREATE INDEX "idx_6fe2655d92741d25" ON "bookmark_article" USING btree ("bookmark_id" uuid_ops);
*/