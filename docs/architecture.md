# Basango architecture

## Applications

- `apps/api`: Hono REST and tRPC API. It separates machine ingestion writes from authenticated operations reads.
- `apps/dashboard`: TanStack Start operations and dataset dashboard, including realtime ingestion monitoring.
- `apps/mobile`: Expo React Native reader.
- [`basango-rs`](https://github.com/bernard-ng/basango-rs): the only crawler implementation. It runs independently from this Bun workspace.

The organization follows the same boundary-oriented direction as Midday: applications own delivery concerns, while packages own reusable domain and persistence capabilities. Basango's implementation remains specific to its ingestion pipeline rather than copying Midday's business modules.

## Crawler data flow

```text
Rust crawler ─────POST /ingest/articles────► ingestion REST ──► articles
      │
      └──────POST /ingest/signals─────────► ingestion service ──► operations projection
                                                                       │
dashboard ◄── tRPC snapshot + authenticated SSE invalidation ──────────┘
```

The crawler owns source adapters, Redis queues, workers, retries, its durable SQLite outbox, and the facts emitted by its agents. The domain package owns the signal wire contract. The API service validates and projects those facts into `ingestion_agent`, `ingestion_run`, and `ingestion_activity`. The dashboard reads that projection through an authenticated tRPC operations procedure, then listens for server-sent invalidations and periodically polls as a reconnect safety net.

Signals use stable `agent.*` and `run.*` names, UUID signal IDs, and absolute run metrics. This makes retries idempotent and keeps transport messages independent from the dashboard's read shape.

Article ingestion uses an `Idempotency-Key` header equal to the MD5 identity of the article link. The API verifies that identity, then PostgreSQL's unique article-hash constraint and an atomic insert-on-conflict operation make retries return the canonical article instead of creating duplicates. The response states whether that request created the record.

## Packages

- `@basango/domain`: shared API schemas and models, including the ingestion signal protocol.
- `@basango/db`: Drizzle ORM, PostgreSQL migrations, signal projection, and operations queries.
- `@basango/logger`: structured application logging.
- `@basango/ui`: shared React components.
- `@basango/tsconfig`: shared TypeScript configuration.

## TypeScript application boundaries

The dashboard and mobile reader keep platform-specific routes, navigation, environment access, and presentation in
their owning applications. Shared packages own stable, reusable contracts or infrastructure; they are not a default
home for new application behavior.

The dashboard consumes the API through its app-owned tRPC client and imports router types only from the API's explicit
public export. Client applications never import persistence or logging packages. The React Native
application may share platform-neutral domain contracts, but it must not consume the DOM-based `@basango/ui` package.

See the [TypeScript application architecture](web/README.md) for the dependency graph and package recommendations, and
the [TypeScript and React code-style guide](web/code-style.md) for the normative module-design rules.

## Development

- `bun run dev` starts the applications in this repository.
- `bun run crawler:worker` starts the Rust worker from a sibling `../basango-rs` checkout.
- `bun run build:crawler` builds the Rust crawler in release mode.
- Apply database migrations before using ingestion operations: `bun run migrate`.

Production crawler processes are managed by the systemd units in the Rust repository rather than the Bun/PM2 application definition.
