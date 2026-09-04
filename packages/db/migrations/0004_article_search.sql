CREATE TABLE "article_search_outbox" (
	"article_id" uuid PRIMARY KEY NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_error" text,
	"operation" varchar(16) NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_article_search_outbox_operation" CHECK (operation IN ('delete', 'upsert'))
);
--> statement-breakpoint
DROP INDEX "gin_article_tsv";--> statement-breakpoint
CREATE INDEX "idx_article_search_outbox_available" ON "article_search_outbox" USING btree ("available_at","article_id");--> statement-breakpoint
ALTER TABLE "article" DROP COLUMN "tsv";
