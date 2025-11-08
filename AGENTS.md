Basango — AGENTS.md

Scope
- Applies to the entire repository.
- Use these conventions when adding/modifying code, scripts, or docs.

Environment
- Node: >= 22
- Package manager: Bun `1.3.x`
- Task runner: Turborepo
- Lint/format: Biome

Workspace Layout
- `workspaces`: `apps/*` and `packages/*`.
- Internal packages use the `@basango/` scope and `workspace:*` versions.
- Avoid nested packages like `apps/**` or `packages/**`.

Packages
- `@basango/logger`: Pino wrapper. Prefer named import `import { logger } from "@basango/logger"`.
- `@basango/db`: Drizzle ORM for Postgres. Import via defined subpaths (`./client`, `./queries`, `./schema`, `./utils`).
- `@basango/ui`: Shared UI.
- `@basango/tsconfig`: Shared TS configs. Extend this in apps/packages.

Conventions
- ESM-only: set `"type": "module"` for packages that ship code.
- TypeScript everywhere. Use `extends: "@basango/tsconfig/base.json"` when possible.
- Prefer named exports in libraries. Avoid barrel files unless necessary.
- Use `workspace:*` for internal dependencies; do not hardcode versions.
- Keep changes minimal and localized; avoid cross-cutting refactors without discussion.

Tasks & Commands
- Install: `bun install` (run at repo root only).
- Dev: `bun run dev`.
- Build: `bun run build`.
- Typecheck: `bun run typecheck`.
- Lint/format: `bun run lint` or `bun run format`.
- Turbo filtering examples:
  - `bunx turbo dev --filter=@basango/crawler`
  - `bunx turbo build --filter=@basango/dashboard`

Adding a New Package
- Place apps in `apps/<name>`; libraries in `packages/<name>`.
- Use scoped name: `@basango/<name>` and set `"private": true` unless publishing.
- If a lib exposes multiple entrypoints, prefer `exports` map over `main`.
- Add dependencies with `bun add <pkg>` in the package directory; internal deps as `workspace:*`.

Logging
- Import logger as `import { logger } from "@basango/logger"` for consistency.
- Production logs are structured JSON; non-production uses `pino-pretty` transport.

Testing
- Use `vitest` where present. Add tests locally to the package being changed.
- Keep tests fast and focused. Do not introduce global test state.

Quality Gates
- `biome` formatting/linting is enforced. Run before committing.
- `manypkg check` runs as part of `bun run lint` to validate workspace correctness.

Commits & Hooks
- Conventional commits via Commitizen: `bunx cz`.
- Commitlint enforces message format. Husky hooks run on commit.

Gotchas
- Ensure `apps/*` and `packages/*` are the only workspace globs.
- Prefer named import for logger to avoid mixing default/named across files.

Contact Points
- Architecture overview: `docs/architecture.md`.
- Architecture map: `docs/architectures/README.md`.

