# Basango TypeScript applications

This guide describes the architecture shared by Basango's TypeScript applications and packages. The dashboard is a
TanStack Start and React application; the mobile reader is an Expo and React Native application. Both are managed with
Bun and Turborepo, but they keep platform-specific presentation and runtime behavior in their owning application.

The normative TypeScript, React, module-design, and package-interface rules live in the
[code-style guide](code-style.md). New and modified authored code follows that guide immediately. Generated files,
registry-owned UI primitives, and framework configuration retain their generated conventions unless they contain
substantive Basango-owned behavior.

## Applications

- `apps/dashboard` owns browser routes, authenticated operations workflows, TanStack Query state, tRPC client wiring,
  and dashboard-specific presentation.
- `apps/mobile` owns Expo routes, native navigation, device integrations, and reader presentation.
- `apps/api` owns the Hono HTTP boundary and tRPC router. It is a server application, not a browser utility package.

Keep route composition, navigation, environment access, and platform-specific behavior in the owning application.
Start new product behavior there. Extract it only after a stable package responsibility is visible.

Environment files are an exception to application ownership: all TypeScript applications use the repository-root
precedence documented in the [environment configuration guide](../environment.md). Application-specific `.env` files
must not be added under `apps/` or `packages/`.

The root Bun configuration uses hoisted dependency linking so Expo autolinking sees one physical copy of each native
module. Keep native dependency versions aligned with the installed Expo SDK before changing that layout.

## Shared packages

- `@basango/domain` owns runtime schemas and inferred TypeScript contracts shared across process boundaries. It must
  remain independent of delivery frameworks and persistence implementations.
- `@basango/ui` owns reusable web presentation primitives. It is DOM-based and must not be imported by the React
  Native application.
- `@basango/db` owns Drizzle schemas, PostgreSQL access, queries, and persistence services. Client applications must
  not import it.
- `@basango/logger` owns structured server logging.
- `@basango/search` owns article search and indexing contracts plus the Meilisearch adapters.
- `@basango/tsconfig` owns shared TypeScript compiler defaults.

A shared package is justified when it has at least two real consumers or one clear package-owned responsibility. A
package should expose a small stable interface and hide cohesive implementation detail. Do not create a package merely
to relocate one application's file.

## Dependency direction

Each arrow points from the importer to the dependency:

```text
dashboard -> api (exported tRPC types only), domain, ui
mobile    -> api (exported tRPC types only), domain
api       -> db, domain, logger, search
db        -> domain, logger, search
logger     -> domain
search     -> third-party services through HTTP
ui         -> third-party UI libraries only
domain     -> platform-neutral libraries only
```

The following constraints preserve those boundaries:

- no package imports from an application;
- no client application imports `@basango/db` or `@basango/logger`;
- dashboard and mobile import API router types only through the explicit `@basango/api/trpc/routers/_app` export;
- mobile does not import `@basango/ui` or browser-only modules;
- packages do not re-export another package's domain symbols as their own;
- the search package does not import persistence code; the DB package maps canonical rows into search documents;
- a new lateral package dependency needs a real ownership relationship and an update to this graph.

## Application organization

Organize growing application code by bounded context and product capability before technical role:

```text
src/features/<context>/<capability>/
  pages/ or screens/
  components/
  hooks/
  <capability>-query.ts
  <capability>-schema.ts
  <capability>-copy.ts
```

Dashboard capabilities use `pages/`; mobile capabilities use `screens/`. This is a target shape, not a reason for a
repository-wide move. Existing top-level `components/`, `hooks/`, and route modules may evolve capability by
capability. Keep a private single-consumer component or hook beside its owner when that improves locality.

Route modules should compose feature interfaces and own route concerns. They should not accumulate reusable business
logic, cache policy, large presentation trees, or transport normalization.

The dashboard uses this concrete top-level structure:

```text
apps/dashboard/src/
  app/       # application core: auth policy, shell, shared app components, tRPC, environment
  features/  # product contexts and capabilities, including their pages and UI
  routes/    # thin TanStack Router adapters, guards, metadata, and query preloading
```

The root route owns the public-versus-authenticated shell decision. Authenticated route modules apply the shared admin
session guard, preload route data, and render a feature page. Feature pages own presentation and query consumption;
they do not import route modules or generated route symbols.

The mobile reader mirrors those ownership boundaries with Expo-specific names:

```text
apps/mobile/src/
  app/          # Expo Router screen re-exports and framework-owned navigation layouts
  application/  # native auth, providers, environment, app-level screens, and typed tRPC client
  features/     # reader capabilities and product components
  ui/           # app-local native primitives and theme helpers
```

Mobile screen route modules do not define React components; each directly re-exports a feature- or application-owned
screen so product state, queries, and presentation stay outside the routing tree. Expo Router `_layout.tsx` modules
are the framework-level exception and own their navigator composition in place.

## Package interfaces

Cross a package seam only through an entry declared in that package's `exports` map. Use relative imports inside the
package and `@basango/<package>` only from consumers. Do not map another package's source tree in `tsconfig.json` as a
substitute for a public interface.

An `index.ts` is an interface or composition module. Keep behavior in responsibility-named modules and use explicit
exports. Wildcard exports are reserved for the UI registry's component-per-file convention.

Shared versions used by multiple workspaces belong in the root Bun catalog and package manifests reference them with
`catalog:`. Internal dependencies always use `workspace:*`.

## Data access

The dashboard and mobile reader consume the API through app-owned tRPC clients. For direct operations, compose TanStack Query's
`useQuery` and `useMutation` with `trpc.*.queryOptions()` and `trpc.*.mutationOptions()`. Use procedure-owned query
keys for invalidation. A custom query function is reserved for a composed workflow, pagination adapter, server action,
or deliberate transformation.

The domain package owns reusable Zod contracts. Components infer input types from those schemas rather than manually
duplicating transport payloads. Database rows and Drizzle types do not cross into client code as API contracts.

## UI ownership

Use `@basango/ui` for reusable browser primitives and keep product-specific composites in the dashboard until they
have more than one real web consumer. Do not place API calls, application navigation, authentication policy, or
dashboard copy in the UI package.

React Native components remain in `apps/mobile` unless a future native-specific package has multiple consumers. Share
platform-neutral schemas and pure logic across web and mobile, not DOM components.

## Verification

Run commands from the repository root:

```bash
bun run format
bun run lint
bun run typecheck
bun run test
```

Build the affected application when routing, server rendering, bundling, or runtime boundaries change. Run
`bun run lint` whenever a manifest, workspace dependency, or package export changes so `manypkg` validates the graph.
