# Deployment

The production checkout lives at `/var/www/html/basango.ngandu.dev`. PM2 runs the API on
`127.0.0.1:3080` and the dashboard on `127.0.0.1:3001`; Nginx is the only public entrypoint.

## Nginx

Install the committed HTTP configuration and enable it:

```bash
sudo cp deploy/nginx/basango.ngandu.dev.conf /etc/nginx/sites-available/basango.ngandu.dev.conf
sudo ln -s /etc/nginx/sites-available/basango.ngandu.dev.conf /etc/nginx/sites-enabled/basango.ngandu.dev.conf
sudo nginx -t
sudo systemctl reload nginx
```

Ensure the DNS records for `dashboard.basango.ngandu.dev` and `api.basango.ngandu.dev` point to the
server before requesting certificates. When both HTTP hosts resolve correctly, Certbot can add TLS:

```bash
sudo certbot --nginx \
  -d dashboard.basango.ngandu.dev \
  -d api.basango.ngandu.dev
```

The API configuration disables proxy buffering for `/operations/ingestion/stream`, allowing
server-sent ingestion updates to reach the dashboard immediately.

The `/ingest/*` routes remain publicly reachable through Nginx for the Rust crawler. They are
protected by the crawler token at the API boundary, rather than by an IP allowlist, so Raspberry
Pi agents can connect from changing networks. On every crawler host, configure:

```dotenv
BASANGO_API_CRAWLER_ENDPOINT=https://api.basango.ngandu.dev
BASANGO_API_CRAWLER_TOKEN=replace-with-the-same-secret-as-the-api
```

The endpoint is the API origin without `/ingest`; the crawler appends `/ingest/articles` and the
other ingestion paths itself. The token must exactly match `BASANGO_API_CRAWLER_TOKEN` in the
TypeScript API's root `.env.local`. Keep both values secret. Before Certbot enables HTTPS, use
`http://api.basango.ngandu.dev` only for an initial connectivity check, then switch the crawler to
the HTTPS endpoint.

The `/mcp` route is also publicly reachable through Nginx and requires its own read-only Bearer
credential. Configure a different random secret in the API's root `.env.local`:

```dotenv
BASANGO_MCP_TOKEN=replace-with-a-separate-long-random-secret
```

Configure the same value as the Bearer token in the MCP client. Do not reuse the crawler token.

## Application processes

From `/var/www/html/basango.ngandu.dev`, deploy or restart with:

```bash
make deploy
```

This installs the frozen Bun dependencies, builds the dashboard with its production public URLs,
applies Drizzle migrations, reloads both PM2 processes, and saves the PM2 process list.

For first-time server setup, enable PM2 startup persistence using the command printed by:

```bash
pm2 startup
pm2 save
```

The committed root `.env` only contains safe development examples. On the server, create an ignored
root `.env.prod` for production-wide values:

```dotenv
VITE_PUBLIC_API_URL=https://api.basango.ngandu.dev
VITE_PUBLIC_URL=https://dashboard.basango.ngandu.dev
BETTER_AUTH_URL=https://api.basango.ngandu.dev
BETTER_AUTH_COOKIE_DOMAIN=.basango.ngandu.dev
```

Put the API database, crawler token, MCP token, and Better Auth secret in root `.env.local`.
That file is loaded after `.env.prod`, so it is the final file-based override and stays outside Git.
Variables injected directly by PM2 or the host still take precedence. See the
[environment configuration guide](environment.md) for the complete convention.

## Article search

Meilisearch is an internal API dependency and must not be exposed through Nginx. Start the pinned service and confirm
that it is healthy before restarting the API:

```bash
docker compose up -d meilisearch
docker compose ps meilisearch
```

Set a long random `BASANGO_MEILISEARCH_API_KEY` in `.env.local`; keep
`BASANGO_MEILISEARCH_URL=http://127.0.0.1:7700`. The Compose port is bound only to loopback.

After the first search migration, backfill and verify the existing corpus:

```bash
NODE_ENV=production bun run search:rebuild
NODE_ENV=production bun run search:verify
```

Drain durable deferred updates every minute. Use a non-overlapping scheduler because one run may process multiple
batches:

```cron
* * * * * cd /var/www/html/basango.ngandu.dev && flock -n /tmp/basango-search-sync.lock env NODE_ENV=production /absolute/path/to/bun run search:sync >> /var/log/basango-search-sync.log 2>&1
```

See [article search operations](search.md) for rebuild and recovery details.

## Ingestion data retention

The ingestion operations projection is disposable monitoring data. Prune events, completed or
failed runs, and stale inactive agents with:

```bash
NODE_ENV=production bun run ingestion:cleanup
```

The default retention period is five days. Override it when needed with
`--retention-days <days>`. Articles, sources, categories, and reader data are never deleted by this
command.

Run the cleanup daily from the production checkout. Cron uses a minimal environment, so replace
the Bun path below with the absolute path returned by `command -v bun` for the deployment user:

```cron
15 3 * * * cd /var/www/html/basango.ngandu.dev && NODE_ENV=production /absolute/path/to/bun run ingestion:cleanup >> /var/log/basango-ingestion-cleanup.log 2>&1
```
