Basango Architecture Map

Structure
- apps/
  - crawler: Bun + TS crawler (sync/async workers)
  - dashboard: Next.js 16 app
  - mobile: Expo React Native app
  - api-legacy, mobile-legacy: legacy reference apps
- packages/
  - logger: `@basango/logger` (pino wrapper)
  - db: `@basango/db` (Drizzle + Postgres)
  - encryption: `@basango/encryption` (encryption utils)
  - ui: `@basango/ui` (shared UI, package.json in `packages/ui/src`)
  - tsconfig: `@basango/tsconfig` (shared TS configs)

Workspaces
- Root `package.json` → `"workspaces": ["apps/*", "packages/*"]`.
- Internal deps use `workspace:*` and are linked locally.

Build & Dev
- `bun run dev` → dev servers/workers via Turbo.
- `bun run build` → builds respecting dependency graph.
- `bun run typecheck`, `bun run lint`, `bun run format`.

Notes
- ESM-only codebase.
- Prefer named import `logger` from `@basango/logger`.
- If adding a new package, place in `apps/*` or `packages/*` and set a scoped name `@basango/<name>`.
