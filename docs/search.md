# Article search operations

Article text search is a derived Meilisearch projection. PostgreSQL is authoritative, and ordinary newest-first lists
never depend on Meilisearch.

## Local setup

1. Start PostgreSQL and Meilisearch with `docker compose up -d postgres meilisearch`.
2. Apply the database migration with `bun run migrate`.
3. Backfill the index with `bun run search:rebuild`.
4. Confirm count parity with `bun run search:verify`.

The public and admin tRPC APIs expose `articles.search`; MCP exposes `search_articles`. All require a non-empty query.
Blank client searches continue to call the corresponding PostgreSQL list procedure.

## Repair and rebuild

Every newly inserted article and every affected source/category denormalization change creates or refreshes an outbox
entry. The API makes an immediate best-effort synchronization after the PostgreSQL commit. Run `bun run search:sync`
periodically to drain any entries left by service failures or restarts. Failed entries use bounded exponential retry
delays and keep their latest error for diagnosis.

`bun run search:rebuild` writes the full corpus to a uniquely named temporary index using UUID keyset pagination and
byte-bounded indexing batches. It waits for every asynchronous Meilisearch task, checks count parity, atomically swaps
the temporary index with `articles`, deletes the old index, and drains changes recorded during the rebuild.

If rebuild verification fails, the live index is unchanged and the temporary index is deleted. Investigate PostgreSQL
write activity, malformed oversized documents, connectivity, and Meilisearch task errors before retrying.
