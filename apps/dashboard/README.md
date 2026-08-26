## Basango Dashboard

The dashboard manages the Basango dataset and provides an ingestion operations view for the Rust crawler fleet.

The **Ingestion** page shows online agents, active and recent runs, discovered/processed/persisted/skipped/delivered/failed totals, failures, and lifecycle activity. Focused tRPC operations reads are authoritative; the authenticated SSE stream sends coalesced topic invalidations that selectively refresh those reads. There is no polling fallback: when SSE disconnects, the page keeps its last data and visibly reports that realtime updates are unavailable. Legacy runs show unknown processed/skipped values instead of guessing how their discovery-to-persistence gap was produced.

Authentication is provided by Better Auth through HttpOnly session cookies. The dashboard accepts only users with the `admin` role and includes Better Auth-backed sign-in, sign-out, forgot-password, and reset-password flows. General web and mobile users can share the same API identity and session tables without receiving dashboard access.

### Source architecture

Dashboard source follows the same separation as the platform applications:

- `src/app` contains application-core concerns such as the authenticated shell, auth policy, shared app components,
  environment access, and tRPC setup.
- `src/features` contains product-owned pages, components, hooks, dialogs, forms, and pure feature logic.
- `src/routes` contains thin TanStack Router modules responsible for guards, metadata, parameter/search parsing, query
  preloading, and delegation to feature pages.

Routes must not own large presentation trees or reusable product behavior. Code within one feature slice uses relative
imports; imports across application or feature seams use the `#dashboard` alias.
