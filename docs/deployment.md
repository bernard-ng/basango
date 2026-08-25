# Deployment

The production checkout lives at `/var/www/html/basango.ngandu.dev`. PM2 runs the API on
`127.0.0.1:3080` and the dashboard on `127.0.0.1:3000`; Nginx is the only public entrypoint.

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
TypeScript API's root `.env`. Keep both values secret. Before Certbot enables HTTPS, use
`http://api.basango.ngandu.dev` only for an initial connectivity check, then switch the crawler to
the HTTPS endpoint.

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

The root `.env` must provide the API database, encryption, crawler token, and Better Auth secrets.
Use these public authentication values:

```dotenv
BETTER_AUTH_URL=https://api.basango.ngandu.dev
BETTER_AUTH_COOKIE_DOMAIN=.basango.ngandu.dev
```
