ALTER TABLE "ingestion_run" ADD COLUMN "articles_processed" integer;--> statement-breakpoint
ALTER TABLE "ingestion_run" ADD COLUMN "articles_skipped" integer;--> statement-breakpoint
ALTER TABLE "ingestion_run" ADD CONSTRAINT "chk_ingestion_run_reconciliation_metrics_nonnegative" CHECK (("ingestion_run"."articles_processed" IS NULL OR "ingestion_run"."articles_processed" >= 0) AND ("ingestion_run"."articles_skipped" IS NULL OR "ingestion_run"."articles_skipped" >= 0));
