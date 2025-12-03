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
ALTER TABLE "article" ADD COLUMN "category_id" uuid;--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "clustered" boolean DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "unq_category_name" ON "category" USING btree (lower((name)::text));--> statement-breakpoint
CREATE UNIQUE INDEX "unq_category_slug" ON "category" USING btree (lower((slug)::text));--> statement-breakpoint
CREATE INDEX "idx_category_weight" ON "category" USING btree ("weight");--> statement-breakpoint
ALTER TABLE "article" ADD CONSTRAINT "fk_article_category_id" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_article_category_id" ON "article" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_article_clustered" ON "article" USING btree ("clustered");