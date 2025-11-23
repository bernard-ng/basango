ALTER TABLE "article" drop column "tsv";--> statement-breakpoint
ALTER TABLE "article" ADD COLUMN "tsv" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('french'::regconfig, COALESCE(title, '')::text), 'A'::"char")) STORED;--> statement-breakpoint
