# Database Migration Plan: MariaDB to PostgreSQL

This document captures the current understanding of the persistence layer and lays out the plan for migrating Basango's backend from MariaDB 10.11 to PostgreSQL 16. It will evolve as the Doctrine mappings and migrations are adapted for PostgreSQL-specific capabilities.

## 1. Current Storage Footprint

* Doctrine connects to MariaDB through `DATABASE_URL` defined in `.env` and environment overrides. The URL is currently `mysql://root:root@mariadb:3306/app?serverVersion=Mariadb-10.11.11&charset=utf8mb4`.
* Custom Doctrine DBAL types (`article_id`, `open_graph`, etc.) are registered in `config/packages/doctrine.yaml`. These will continue to work with PostgreSQL as they are platform-agnostic, but their SQL declarations must be verified once the platform switches.
* Article persistence relies on MySQL-specific generated columns for `image` and `excerpt`, and maintains indexes on `hash`, `publishedAt`, and `publishedAt + id` for cursor pagination. JSON is stored via the custom `open_graph` type.
* Feed management tables (`bookmark`, `comment`, etc.) rely on boolean defaults stored as `0/1` and on cascaded relations that will need to be expressed with PostgreSQL `ON DELETE` behaviour.

## 2. Design Goals for the PostgreSQL Schema

1. Preserve all existing data while enabling PostgreSQL features needed by the product roadmap (full-text search, advanced indexing, vector similarity, etc.).
2. Replace MySQL-specific constructs:
   * Convert generated columns to PostgreSQL generated columns or materialized expressions (e.g. `image` JSON path extraction can use `GENERATED ALWAYS AS ((metadata->>'image')) STORED`).
   * Revisit boolean defaults (`DEFAULT FALSE/TRUE`) instead of `0/1`.
   * Use `JSONB` for `open_graph` payloads.
3. Optimise pagination and search:
   * Create a descending composite index on `(published_at DESC, id DESC)` to support cursor-based feeds.
   * Evaluate trigram (`pg_trgm`) or GIN indexes for text-heavy fields (`title`, `body`, `comment.content`) as part of future search features.
4. Leverage UUIDs or native sequences as appropriate. Current IDs are custom types backed by strings; confirm compatibility or migrate to `UUID` columns if a future mapping change adopts them.
5. Ensure all `ON DELETE CASCADE` relationships continue working and enforce them with foreign keys in PostgreSQL.

## 3. Migration Workflow

1. **Preparation**
   * Freeze application writes or enable maintenance mode.
   * Capture a final MariaDB snapshot using the existing `bin/backup.sh` script (it currently runs `mysqldump`). Extend it later to dump PostgreSQL once cut-over is complete.
   * Provision the target PostgreSQL cluster (version ≥ 16) with sufficient disk and I/O.
   * Enable required extensions on the target database (`pg_trgm`, `unaccent`, `uuid-ossp`, `pgcrypto`, `vector`) as they become necessary for new features.

2. **Schema Translation**
   * Generate Doctrine migration diffs against PostgreSQL to obtain the base schema.
   * Manually adjust the generated migrations to:
     - Replace column definitions for custom generated columns and JSON data.
     - Introduce explicit collations if case-insensitive comparisons are required.
     - Define indexes (including descending and GIN/GIST indexes) tailored to PostgreSQL.
   * Version these migrations but defer execution until the data transfer is complete.

3. **Data Transfer**
   * Use the new `projects/backend/bin/migration.sh` helper with the production connection strings to run `pgloader` (or equivalent) from MariaDB to PostgreSQL.
   * Validate row counts and checksum critical tables after the load.
   * Rebuild sequences or UUID generators if the Doctrine mappings change.

4. **Post-Load Migration**
   * Execute Doctrine migrations against PostgreSQL to create indexes, generated columns, and constraints that `pgloader` could not translate.
   * Run integrity checks (foreign keys, uniqueness).
   * Recompute derived data if needed (e.g. if the excerpt column becomes a materialized value stored via trigger or generated column).

5. **Application Cut-over**
   * Update environment variables (`DATABASE_URL`, Docker compose definitions, CI secrets) to point to PostgreSQL.
   * Deploy code that contains PostgreSQL-specific mappings and migrations.
   * Run `bin/console cache:clear` and smoke test core flows (ingesting articles, bookmarking, commenting, authentication).
   * Monitor logs and metrics; keep the MariaDB snapshot for rollback until stability is confirmed.

## 4. Testing & Validation Strategy

* Automated: run the Symfony test suite and linters against a PostgreSQL database to surface platform-specific issues.
* Manual: verify API endpoints that rely on time-based pagination to ensure the descending index behaves as expected.
* Performance: benchmark feed queries, full-text search prototypes, and vector similarity routines once indexes are in place.

## 5. Open Questions / TODOs

* Confirm how custom DBAL types serialize/deserialise when mapped to PostgreSQL column types (e.g. ensure `open_graph` becomes `JSONB`).
* Decide whether to retain the string-based identifiers or transition to native UUID columns while switching databases.
* Determine if additional data transformations are required for timezone handling when migrating `datetime_immutable` columns.
* Document rollback procedures once the PostgreSQL migration is complete.

