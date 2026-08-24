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

Documentation
- Engineering documentation belongs under `docs/`.
- Before changing a TypeScript application or shared package, read `docs/web/README.md` and the relevant package or feature documentation.
- All authored TypeScript and React follows `docs/web/code-style.md`. It is authoritative for naming, readability, React patterns, module boundaries, and package interfaces.
- Update architecture documentation when a change introduces a new application, package, process boundary, public package entrypoint, or workspace dependency direction.

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
- When using tRPC in React, always compose `useQuery`/`useMutation` from TanStack with `trpc.*.queryOptions`/`mutationOptions` instead of calling `trpc.*.useQuery`/`useMutation` helpers directly (they are deprecated).

Architecture
- Organize application code by bounded context and product capability before technical role.
- Keep route composition, navigation, environment access, and platform behavior in the owning application.
- Start new behavior in its owning application. Extract it only for at least two real consumers or a clear package-owned responsibility.
- Packages expose small, intentional interfaces and hide cohesive implementation details.
- No package may import from an application. No client application may import `@basango/db`, `@basango/logger`, or `@basango/encryption`.
- Dashboard code imports API router types only through the explicit `@basango/api/trpc/routers/_app` export.
- Mobile may share platform-neutral domain contracts but must not import the DOM-based `@basango/ui` package.
- Follow the dependency graph in `docs/web/README.md`. A new lateral package dependency requires a real ownership relationship and a documentation update.

TypeScript
- Use `type`. Use `interface` only when declaration merging or third-party module augmentation requires it.
- Define API transport, persisted structured data, and structured form contracts as Zod schemas.
- Infer TypeScript types from Zod rather than duplicating contract types manually. A focused typed parser is sufficient for one simple route or environment value.
- Use camelCase for schema properties.
- Use function declarations for named functions, components, hooks, handlers, formatters, predicates, and factories. Reserve arrow functions for inline callbacks and expression-based wrappers.
- Use `T[]` and `readonly T[]`, `unknown` at untrusted seams, and discriminated unions instead of enums.
- Use `import type` for type-only dependencies.
- Prefer `undefined` for omitted internal values. Preserve `null` only where a transport or persisted contract distinguishes it.

Readability
- Separate logical blocks with one blank line: declaration groups, control flow, side effects, render guards, and final returns must read as distinct semantic paragraphs.
- Put one blank line between every top-level schema, type, constant, function, and component declaration.
- Always use braces and multiline bodies for `if`, `for`, `while`, `switch`, and `try`; never compress a guard or side effect onto one line.
- Inside a function, closely related side-effect-free declarations may stay together. Do not add padding immediately inside braces or between `if`/`else` and `try`/`catch`.

Imports and Exports
- Use relative imports inside one feature slice or package.
- Use `#dashboard/*` or `#mobile/*` when crossing an application seam.
- Use `@basango/*` only when crossing a declared package seam. Never import a package from itself through its public alias.
- Never import another workspace's undeclared source or internal path. Do not use TypeScript path mappings as a substitute for package exports.
- Omit `.ts` and `.tsx` extensions. Use named React imports rather than `import * as React` in authored code.
- Prefer named exports. Default exports are limited to framework requirements.
- Keep `index.ts` interface- or composition-only and use explicit exports instead of `export *`.
- Do not pass through another package's domain symbols. Consumers import a symbol from its owner.
- Public package paths must be intentional `package.json` exports. Wildcard exports are limited to the UI registry's component-per-file convention.

React
- Keep one owner for each piece of state and derive values during render.
- Use effects only to synchronize with an external system. Event-driven resets belong in a handler or keyed session; asynchronous synchronization must not overwrite dirty input.
- Use a named `ComponentNameProps` type for every exported component. Inline prop types are limited to small private leaves with at most two simple fields.
- Do not use `React.FC` or `React.FunctionComponent`.
- Import Lucide icons using the `Icon` suffix, for example `UserAddIcon`.
- Dashboard components use shared `@basango/ui` primitives where they express the required semantics. Mobile components use React Native or Expo primitives.

Components and Logic
- Keep one stateful UI responsibility per module. Cohesive compound primitives may export a family of parts.
- Split independent dialogs, tabs, workflows, or data lifecycles into composable modules with descriptive names.
- Review behavioral `.ts` and `.tsx` modules at 250 lines and actively look for independent responsibilities above 300 lines. Authored modules above 500 lines require an explicit architectural reason.
- Extract a custom hook for reusable or lifecycle-owning React behavior with a cohesive interface.
- Keep a single-consumer private hook beside its component when that improves locality; put exported reusable feature hooks under `hooks/`.
- Extract calculations and normalization into pure functions, not hooks.
- Introduce an adapter only at a real varying seam. Do not add a pass-through service or hook around one implementation.

Data, Mutations, and Forms
- Compose TanStack Query's `useQuery` and `useMutation` with `trpc.*.queryOptions()` and `trpc.*.mutationOptions()` for direct API operations.
- Use procedure-owned query keys or prefixes for invalidation. Do not invent independent raw query-key arrays in components.
- Reserve handwritten query and mutation functions for composed workflows, pagination adapters, server actions, or deliberate transformations.
- Give each mutation object an imperative domain-verb name and call it directly. Do not wrap `mutate` unless additional behavior is required.
- Every user-triggered mutation must explicitly provide inline error feedback or a localized toast. Deliberately silent failure requires an explanatory comment.
- Mutation-backed HTML forms with structured input use a domain Zod contract and `useZodForm`; do not retype API payloads locally.
- Zero-field confirmations and non-data-entry actions do not need ceremonial schemas.
- Normalize transport errors at the API or application transport seam. Components must not depend on low-level transport internals.

Packages
- Use scoped names `@basango/<name>` and `workspace:*` for internal dependencies.
- Keep package interfaces small and explicit. Internal imports are relative and public subpaths are intentional.
- A package must not expose another package's domain as its own.
- Shared versions used by multiple workspaces belong in the root Bun catalog and consumers reference them with `catalog:`.
- Every workspace TypeScript configuration extends `@basango/tsconfig` when its framework permits. Expo may extend its framework configuration while preserving equivalent strictness.
- The web UI package is DOM-specific. Share schemas and pure platform-neutral logic with mobile, not web components.

Tasks & Commands
- Install: `bun install` (run at repo root only).
- Dev: `bun run dev`.
- Build: `bun run build`.
- Typecheck: `bun run typecheck`.
- Lint/format: `bun run lint` or `bun run format`.
- Turbo filtering examples:
  - `bun run crawler:worker` (starts the sibling Rust crawler)
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
- TypeScript applications and package boundaries: `docs/web/README.md`.
- TypeScript and React module design: `docs/web/code-style.md`.
- Forms handling patterns: `docs/forms-handling.md`.
