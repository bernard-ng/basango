# TypeScript and React code style and module design

This guide is the normative house style for authored TypeScript and React in `apps/*` and `packages/*`. Its purpose is
to make naming, state ownership, module responsibilities, and package seams predictable enough that a maintainer can
understand unfamiliar code locally.

When this guide and an older local convention disagree, this guide is the target. Apply it to new and modified code;
use dedicated mechanical changes for repository-wide migrations. Generated files such as `routeTree.gen.ts`, build
artifacts, and shadcn primitives kept substantively identical to their registry source are exempt. Any retained
exception in authored code should be narrow and record its reason near the suppression or tool configuration.

## Decision principles

Use these principles in order:

1. Preserve domain ownership. Organize by product capability before technical role.
2. Prefer one obvious way to express a common operation.
3. Keep modules deep: expose a small interface and hide cohesive implementation detail.
4. Optimize for local reading. A module should reveal its purpose, dependencies, state transitions, and failure modes.
5. Let Biome own mechanical formatting; let this guide own semantic spacing, naming, and module design.
6. Follow the dominant house convention instead of introducing a second equivalent style.

`must` marks a rule. `should` marks the default and requires a concrete local reason to deviate.

## Source-file grammar

Order authored modules as follows:

1. imports organized by Biome, with type-only dependencies marked explicitly;
2. module constants required by runtime schemas;
3. schemas followed immediately by their inferred types;
4. remaining types, constants, and configuration;
5. the primary exported function or component;
6. private components and hooks;
7. private pure helpers.

Runtime dependency order wins over the template. A literal tuple, for example, must appear before a Zod schema that
consumes it. Keep the public interface near the top and export declarations where they are defined. A trailing export
block belongs only in an interface-only composition module.

## Readability and blank lines

Blank lines separate ideas. Treat a function body as a sequence of short semantic paragraphs.

Insert one blank line:

- between every top-level schema, type, constant, function, component, and export group;
- between declaration groups with different roles;
- after declarations and before control flow or a side effect;
- before and after an `if`, `for`, `while`, `switch`, or `try` block when another statement surrounds it;
- before a final `return` after a function has performed more than one logical step;
- between React hook groups, derived values, handlers, render guards, and final JSX.

Closely related, side-effect-free declarations inside a function may remain together. Do not add padding immediately
inside braces, between `if` and `else`, or between `try`, `catch`, and `finally`.

Always use braces and multiline bodies for control flow, including a single statement. Do not compress guards,
mutation calls, loop controls, or error paths onto one line.

```ts
function visibleArticles(articles: readonly Article[], query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase("fr-CD");
  const matches = articles.filter((article) => matchesArticle(article, normalizedQuery));

  if (matches.length === 0) {
    return [];
  }

  const sortedArticles = matches.toSorted(compareArticleTitles);

  return sortedArticles;
}
```

## Functions

Use function declarations for named functions:

- React components and custom hooks;
- event handlers;
- transformations, formatters, predicates, and factories;
- asynchronous operations defined at module scope.

Reserve arrow functions for inline callbacks and expression-based wrappers whose interface requires a function value.
An expression such as `memo(function ArticleRow() {})` is a valid exception. Do not use `React.FC` or
`React.FunctionComponent`; type props directly.

## Types and schemas

- Use `type`. Use `interface` only for declaration merging or third-party module augmentation.
- Use `unknown` at untrusted seams and narrow it. Use `any` only inside a documented compatibility adapter.
- Use `T[]` and `readonly T[]`; do not alternate with `Array<T>` by package.
- Prefer discriminated unions and `as const` objects over TypeScript enums.
- Use `satisfies` to check configuration and lookup maps without widening their inferred values.
- Avoid non-null assertions and unchecked casts. Validate or guard at the seam.
- Use `undefined` for omitted internal values. Preserve `null` only when a transport or persisted contract distinguishes
  it, then normalize at the owning seam when practical.

Zod is the source of truth for API transport, persisted structured data, and validated form contracts. It is also the
default for multi-field route search and environment contracts. A single simple route or environment value may use a
focused typed parser. Infer the TypeScript type next to its schema:

```ts
export const createSourceSchema = z.object({
  name: z.string().trim().min(1),
  url: z.url(),
});

export type CreateSource = z.infer<typeof createSourceSchema>;
```

Do not hand-copy an API payload into a component or hook. Import the inferred contract or derive a form-only schema
with `pick`, `omit`, `extend`, or `merge` and infer its values.

A file named `types.ts` must be type-only. Runtime schemas belong in `contracts.ts` or a responsibility-named
`*-schema.ts`; defaults in `*-defaults.ts`; copy in `*-copy.ts`; formatting in a named formatter module.

## Naming

| Concern | Convention | Example |
| --- | --- | --- |
| Files and directories | kebab-case | `source-publication-chart.tsx` |
| Components and types | PascalCase | `SourcePublicationChart` |
| Functions and values | camelCase | `resolvePublicationWindow` |
| Hooks | `use` + domain intent | `useIngestionOverview` |
| Boolean values | `is`, `has`, `can`, `should`, or `supports` | `isRunning` |
| Callback props | `on` + event | `onSourceCreated` |
| Local event adapters | `handle` + event | `handleSubmit` |
| Domain operations | imperative domain verb | `createSource` |
| Zod schemas | camelCase + `Schema` | `sourceSchema` |
| Component props | component name + `Props` | `SourceDialogProps` |
| Context values | context name + `ContextValue` | `SessionContextValue` |
| Provider props | provider name + `Props` | `SessionProviderProps` |
| Query option factories | resource intent + `QueryOptions` | `sourceDetailsQueryOptions` |
| Mutation objects | imperative domain verb | `updateSource` |

Use normal word casing for acronyms in authored identifiers: `Api`, `Url`, `Http`, and `Id`. Preserve third-party
identifiers such as `baseURL` and the global `URL` only at their external interface.

Use camelCase for local, derived, and runtime-dependent constants. Use `SCREAMING_SNAKE_CASE` for stable module-level
invariants such as fixed limits, path sets, regular expressions, environment names, and protocol constants.

## Imports and exports

Imports must reveal the seam being crossed:

- use relative imports inside one feature slice or package;
- use the owning app's private alias, such as `#dashboard/*` or `#mobile/*`, across application seams;
- use `@basango/<package>` only across package seams;
- never import a package from itself through `@basango/*`;
- never import another workspace's undeclared source or internal path;
- omit `.ts` and `.tsx` extensions;
- use named React imports and `import type` for type-only dependencies.

Prefer named exports. Default exports are limited to framework or tooling requirements.

An `index.ts` is an interface or composition module. It must not own business logic, data fetching, state, or
formatting. Use explicit named exports rather than `export *`. A package must not pass through an unrelated package's
domain symbols. Consumers import a symbol from its owner.

A public-interface contract test may import its own package name specifically to verify the published `exports` map.
Production implementation and implementation-focused tests use relative package-internal imports.

Public package paths must be deliberate entries in `package.json`. Wildcard exports are limited to the UI registry's
primitive-per-file interface. Do not introduce vague `/internal`, `/lib`, or `/utils` exports merely to shorten an
import; prefer a responsibility-named public subpath.

## React components

One module should own one stateful UI responsibility. It may contain small private render helpers, while a cohesive
compound primitive may export a family of parts. Split independent dialogs, tabs, workflows, or data lifecycles even
when they appear on one page.

Use a named `ComponentNameProps` type for every exported component. An inline prop object is allowed only for a small
private leaf with at most two simple fields.

Treat size as a design signal for behavioral `.ts` and `.tsx` modules:

- review a module as it approaches 250 lines;
- above 300 lines, actively look for independent state, data, configuration, and presentation responsibilities;
- an authored module above 500 lines requires an explicit architectural reason.

Do not split solely to satisfy a line count. Split at a seam that creates a smaller interface and a cohesive reason to
change.

In the dashboard, prefer an `@basango/ui` primitive for common controls. A raw HTML control is appropriate while
implementing a low-level primitive or when the shared primitive cannot express the required semantics. In mobile, use
React Native or Expo primitives; never import the DOM-based `@basango/ui` package.

Import Lucide icons using the `Icon` suffix in local names, for example `UserAddIcon`.

## State, hooks, and effects

Keep one owner for each piece of state. Derive values during render rather than copying them into state. Use `useMemo`
for measured expensive work or referential stability required by a collaborator, not as a default style.

An effect synchronizes React with an external system: a browser or device API, network subscription, timer, analytics
adapter, imperative widget, or external form store. Do not use effects to derive state, notify a parent of state it can
own, reset a form because a dialog opened, or implement an event that belongs in a handler. Prefer a keyed form session
or open/change handler for event-driven resets. Synchronization with changed asynchronous input must not overwrite
dirty user data.

Extract a custom hook when stateful behavior is reused, has a cohesive lifecycle, or hides several collaborators behind
a smaller interface. Keep a single-consumer private hook beside its component when that improves locality. Put an
exported reusable feature hook under `hooks/`; keep a context accessor beside its provider.

A hook is not the default home for pure logic. Use a pure function for calculations and normalization, a tRPC procedure
for transport, and an adapter only where behavior genuinely varies. Do not add a pass-through service or hook around
one implementation.

## Queries, mutations, forms, and errors

For direct dashboard API operations:

- compose TanStack Query's `useQuery` and `useMutation` with `trpc.*.queryOptions()` and
  `trpc.*.mutationOptions()`;
- use procedure-owned query keys or prefixes for invalidation;
- let a pagination or feature adapter derive a stable namespaced key from the procedure key;
- do not invent independent raw query-key arrays in components;
- use a manual query or mutation function only for a composed workflow, pagination adapter, server action, or deliberate
  transformation with explicit error semantics.

Give each mutation a domain-verb name and call it directly:

```ts
const createSource = useMutation(trpc.sources.create.mutationOptions());

createSource.mutate(values);
```

Do not wrap `mutate` in a handler unless the handler performs additional work. Every user-triggered mutation must make
its error presentation explicit: inline for correctable form input or through a localized toast for operational
failure. A deliberately silent mutation requires a comment explaining its fallback behavior.

Mutation-backed HTML forms with structured input use a domain Zod schema, a deliberately derived form schema when
needed, and `useZodForm`. Zero-field confirmations and non-data-entry actions do not need ceremonial schemas. Reserve
local draft state for interactions that are not forms.

Normalize transport failures at the API or app transport seam. Components must not understand low-level transport
internals or turn arbitrary failures into empty data unless empty data is the explicit product fallback.

## Feature and package organization

Organize growing application code by bounded context and capability:

```text
src/features/<context>/<capability>/
  pages/ or screens/
  components/
  hooks/
  <capability>-query.ts
  <capability>-schema.ts
  <capability>-copy.ts
```

Dashboard capabilities use `pages/`; mobile capabilities use `screens/`. Use `components/` and `hooks/` for exported
modules in those roles. Private single-consumer modules may stay beside their owner. Keep a schema, query module, or
copy module at the capability root until it forms a real group. Split a growing capability by narrower product
responsibility rather than creating a generic dumping ground.

Prefer responsibility names over vague modules:

- `source-publication-window.ts`, not `utils.ts`;
- `ingestion-status-copy.ts`, not a runtime `types.ts`;
- `article-query-options.ts`, not `helpers.ts`;
- `download-dataset.ts`, not `common.ts`.

Follow the workspace dependency graph in the [TypeScript architecture guide](README.md). No dependency may point from
a package into an application. A new package dependency requires a real ownership relationship and must not be hidden
by re-exporting the collaborator's domain.

Every workspace TypeScript configuration should extend `@basango/tsconfig` when its framework permits. Expo may extend
its framework configuration but should preserve equivalent strictness. Keep application aliases local and resolve
`@basango/*` through manifests and explicit exports rather than mapping another workspace's source tree.

Versions shared by multiple workspaces belong in the root Bun catalog. Keep a package-specific version local only when
the divergence is deliberate.

Start behavior in its owning application. Extract it only for at least two real consumers or a clear package-owned
responsibility. If deleting a wrapper merely moves the same call into one caller, the wrapper is too shallow.

## Exceptions and adoption

Do not mix an unrelated style migration into a behavior change. A touched module must not introduce new drift, and a
small nearby inconsistency should be normalized only when the change is behavior-preserving and easy to review.

Use a dedicated change for repository-wide conversions. Before enabling a new lint rule, make the existing baseline
clean and document narrow framework exceptions so future drift cannot return.

## Review checklist

- Does the module follow the source-file order and semantic blank-line rules?
- Are named functions declared with function declarations and control-flow bodies braced?
- Do names reveal domain ownership, event direction, and data role?
- Are boundary and form values schema-derived rather than duplicated?
- Does each stateful component or hook have one coherent responsibility and one state owner?
- Do tRPC operations, cache keys, invalidation, and error presentation use the app-owned interfaces?
- Do imports cross only intentional application and package seams?
- Is every package interface explicit, owned, and smaller than its implementation?
- Is pure logic in a function rather than an unnecessary hook or service?
- Were formatting, linting, typechecking, relevant tests, and the affected build run?
- If a manifest, workspace dependency, or package export changed, did `bun run lint` pass `manypkg`?
