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

The dashboard search experience supports title autocomplete, full-content or title-only scope, relevance or newest
sorting, source/category/sentiment facets, and inclusive publication-date bounds. Search state stays in the URL so a
filtered result set can be bookmarked or shared.

## Repair and rebuild

### Resumable backfill for small servers

Run `bun run search:resume` to fill missing articles directly into the live index. It checks each UUID page against
Meilisearch before loading article bodies from PostgreSQL, skips indexed articles, and waits for each indexing batch
to succeed. Rerun the same command after an interruption: acknowledged documents remain indexed and are skipped.
There is no checkpoint file or second index. Search results become available incrementally during the backfill.

This command caps batches at 100 articles and 1 MB of JSON; lower `BASANGO_MEILISEARCH_BATCH_SIZE` and
`BASANGO_MEILISEARCH_BATCH_MAX_BYTES` values are respected. An individual document exceeding the byte cap fails
explicitly. These limits bound client batches, not the Meilisearch server's total memory usage.

The progress bar counts articles checked, including skipped articles. After the scan, the command drains the repair
queue so indexed articles with queued metadata changes are refreshed and queued deletions are applied. Retry-delayed
entries remain for a later `search:sync`. Final verification compares counts and exits nonzero on a mismatch.

Use this for immutable article content with metadata updates tracked through the outbox. It does not detect untracked
metadata changes or stale documents without queued deletions. Use `search:rebuild` for a full projection replacement
or document-shape changes. Resume uses the live index and cannot recover work from an old rebuild's temporary index.
Run only one backfill/rebuild command at a time.

### Full replacement and ongoing repair

Every newly inserted article and every affected source/category denormalization change creates or refreshes an outbox
entry. The API makes an immediate best-effort synchronization after the PostgreSQL commit. Run `bun run search:sync`
periodically to drain any entries left by service failures or restarts. Failed entries use bounded exponential retry
delays and keep their latest error for diagnosis.

`bun run search:rebuild` writes the full corpus to a uniquely named temporary index using UUID keyset pagination and
byte-bounded indexing batches. It waits for every asynchronous Meilisearch task, checks count parity, atomically swaps
the temporary index with `articles`, deletes the old index, and drains changes recorded during the rebuild.

Interactive `search:rebuild` runs show a document progress bar. Non-interactive rebuilds omit the animated bar and
retain the final structured summary so redirected logs stay readable. `search:sync` output is unchanged.

If rebuild verification fails, the live index is unchanged and the temporary index is deleted. Investigate PostgreSQL
write activity, malformed oversized documents, connectivity, and Meilisearch task errors before retrying.
