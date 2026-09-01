# Basango architecture

## Applications

- `apps/api`: Hono REST, tRPC, and MCP API. It separates machine ingestion writes from operations and reader-facing reads.
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

## Reader data flow

```text
mobile reader ──authenticated tRPC──┐
                                   ├──► @basango/db public queries ──► articles, sources, categories
MCP client ──Bearer POST /mcp───────┘
```

MCP is a read-only delivery surface over the same database query functions used by the mobile
reader. It adds protocol schemas, tool annotations, JSON serialization, and a dedicated Bearer
credential; it does not duplicate article business logic or introduce a separate news domain.
Publication boundaries are absolute instants, while relative-date requests are interpreted in the
configured `Africa/Lubumbashi` timezone.

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

The dashboard and mobile reader consume the API through app-owned tRPC clients and import router types only from the
API's explicit public export. Client applications never import persistence or logging packages. The React Native
application also shares platform-neutral domain contracts, but it does not consume the DOM-based `@basango/ui`
package. Its shadcn-inspired native primitives and Uniwind theme stay local to `apps/mobile` so platform behavior and
visual decisions remain owned by the application.

The reader surface is authenticated end to end while registration remains open. Better Auth owns the shared identity
and session tables; the Expo client persists native session cookies through SecureStore. Protected reader tRPC
procedures scope bookmarks, followed sources, and comments to the authenticated user.

See the [TypeScript application architecture](web/README.md) for the dependency graph and package recommendations, and
the [TypeScript and React code-style guide](web/code-style.md) for the normative module-design rules.

## Development

- `bun run dev` starts the applications in this repository.
- `bun run crawler:worker` starts the Rust worker from a sibling `../basango-rs` checkout.
- `bun run build:crawler` builds the Rust crawler in release mode.
- Apply database migrations before using ingestion operations: `bun run migrate`.

Production crawler processes are managed by the systemd units in the Rust repository rather than the Bun/PM2 application definition.
