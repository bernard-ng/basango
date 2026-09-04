# Environment configuration

All TypeScript applications read environment files from the repository root. Do not create
application-specific environment files under `apps/` or `packages/`.

## Files and precedence

Environment files are loaded from lowest to highest priority:

1. `.env` contains committed, safe development defaults and documents the available variables.
2. `.env.dev`, `.env.test`, or `.env.prod` overrides `.env` for the selected environment.
3. `.env.local` overrides every environment file and is reserved for machine-local values and
   secrets.
4. Variables already supplied by the process, CI system, or process manager override all files.

Only `.env` is committed. Every `.env.*` file is ignored by Git. Never put production credentials
or personal secrets in `.env`.

`NODE_ENV` accepts exactly `development`, `test`, or `production`. These select `.env.dev`,
`.env.test`, or `.env.prod` respectively. The file suffixes stay concise while `NODE_ENV` follows
the values expected by Node.js and React tooling.

The API, Drizzle commands, dashboard build, and Expo application share this ordering. The dashboard
exposes only variables prefixed with `VITE_` to browser code. Expo exposes only variables prefixed
with `EXPO_PUBLIC_` to native client code; keep them in these same root files.

## Local development

The committed `.env` is enough for the default local Docker services. Put personal overrides in
`.env.local`:

```dotenv
BASANGO_API_CRAWLER_TOKEN=my-local-token
BASANGO_MCP_TOKEN=replace-with-a-local-secret-of-at-least-32-characters
BASANGO_MEILISEARCH_API_KEY=replace-with-a-long-random-master-key
EXPO_PUBLIC_API_URL=http://192.168.1.20:3080
```

Use `.env.dev` when an override should apply to every developer on one machine but should still be
superseded by `.env.local`.

## Production

On the server, set `NODE_ENV=production` and create `.env.prod` for production-wide values. Put
host-specific credentials in `.env.local`. For example:

```dotenv
# .env.prod
VITE_PUBLIC_API_URL=https://api.basango.ngandu.dev
VITE_PUBLIC_URL=https://dashboard.basango.ngandu.dev
BETTER_AUTH_URL=https://api.basango.ngandu.dev
BETTER_AUTH_COOKIE_DOMAIN=.basango.ngandu.dev
```

```dotenv
# .env.local
BASANGO_API_CRAWLER_TOKEN=replace-with-a-long-random-secret
BASANGO_DATABASE_URL=postgresql://...
BASANGO_MCP_TOKEN=replace-with-a-separate-long-random-secret
BETTER_AUTH_SECRET=replace-with-a-long-random-secret
BASANGO_MEILISEARCH_API_KEY=replace-with-a-long-random-master-key
```

The crawler uses the same ingestion token as the API but is configured in the crawler deployment,
not in this TypeScript repository. The MCP token is a separate read-only credential and must never
be reused as the crawler token.

## Search

Local Compose runs Meilisearch on port `7700` with persisted data under `var/volumes/meilisearch`. Search uses these
root environment variables:

```dotenv
BASANGO_MEILISEARCH_URL=http://127.0.0.1:7700
BASANGO_MEILISEARCH_API_KEY=replace-with-a-long-random-master-key
BASANGO_MEILISEARCH_INDEX=articles
BASANGO_MEILISEARCH_TASK_TIMEOUT_MS=120000
BASANGO_MEILISEARCH_BATCH_SIZE=500
BASANGO_MEILISEARCH_BATCH_MAX_BYTES=8000000
```

The API key is redacted from configuration diagnostics. Production should use a restricted key for API search and a
separate administrative key for synchronization when key provisioning is introduced; the current single setting must
have search, index-settings, document, task, stats, and index-swap permissions.

After applying database migrations and starting Meilisearch, initialize an existing corpus with
`bun run search:rebuild`. Schedule `bun run search:sync` periodically to repair deferred updates and use
`bun run search:verify` as an operational consistency check.
