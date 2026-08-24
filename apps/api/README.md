# Basango API

The API is the boundary between the Rust crawler and Basango's canonical dataset.

## Ingestion writes

All crawler writes require the raw `BASANGO_API_CRAWLER_TOKEN` value in the `Authorization` header.

- `POST /ingest/articles` stores an idempotent crawled article.
- `POST /ingest/signals` accepts idempotent `agent.*` and `run.*` operational signals.
- `POST /ingest/sources/publication-bounds` returns the current collection boundary for a source.

The domain package owns request validation. The ingestion service applies signals to the durable operations projection; REST handlers do not contain projection logic.

## Operations reads

Authenticated administrators receive the durable snapshot through `operations.getIngestionOverview` over tRPC. `GET /operations/ingestion/stream` sends lightweight realtime invalidations and uses the same Better Auth session cookie as tRPC. The stream never serves as the source of truth.

## Authentication

Better Auth owns password credentials, sessions, password-reset verifications, and roles. Public sign-up is disabled while the only client is the admin dashboard; future web and mobile clients can use the same `/api/auth/*` API after sign-up is enabled. Dashboard tRPC and operations endpoints require the `admin` role.

Configure:

- `BETTER_AUTH_SECRET`: random secret with at least 32 characters; required in production.
- `BETTER_AUTH_URL`: public API origin, for example `https://api.basango.io`.
- `BETTER_AUTH_COOKIE_DOMAIN`: optional shared production domain, for example `.basango.io`, when API and clients use subdomains.

The dashboard supplies its own origin as the password-reset destination; Better Auth validates it against the configured trusted CORS origins.

## Password reset email delivery

Password reset uses Better Auth's single-use verification flow and Resend's HTTPS API in production. Configure:

- `BASANGO_RESEND_API_KEY`: Resend API key (required in production).
- `BASANGO_RESEND_FROM_EMAIL`: verified sender, for example `Basango <noreply@basango.io>`.
In development, when no Resend API key is configured, the API writes the Better Auth reset URL to the development log. Reset tokens expire after 30 minutes, can only be used once, and reset completion revokes all existing sessions.

Apply the database migrations before enabling password reset or ingestion signals:

```bash
bun run migrate
```

While the schema is still under active development, migration history is intentionally squashed into `0000_init.sql`. Databases that ran an older migration chain must be recreated before applying this baseline.

Create the first dashboard administrator after migrating:

```bash
BASANGO_ADMIN_EMAIL=admin@example.com \
BASANGO_ADMIN_NAME="Basango Admin" \
BASANGO_ADMIN_PASSWORD="replace-with-a-strong-password" \
bun --filter @basango/api auth:create-admin
```
