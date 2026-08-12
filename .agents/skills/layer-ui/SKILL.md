---
name: layer-ui
description: >-
  Owns all Next.js App Router pages and React components for the triagem HR
  platform. Load when touching src/app/(rh)/**/*.tsx, components/**/*.tsx, or any
  page.tsx or layout.tsx under the (rh) route group. Trigger terms: Server
  Component, page, form, table, list, detail, candidato form, triagem pipeline,
  Suspense, useTransition, shadcn, tailwind, components/ui, DomainComponent,
  ResultadoBadge, TriagemForm, notDeleted in page. Do NOT load for Server Actions
  (→ layer-actions), Route Handlers (→ layer-api), or Drizzle schema
  (→ layer-db).
---

# UI Layer

Owns all visual output: Next.js App Router pages under `src/app/(rh)/` and all React
components under `components/`. Pages are Server Components that fetch directly
from Drizzle (always through `notDeleted()`). Forms bind Server Actions from
`layer-actions`. No client-side data fetching.

## Responsibilities

Renders the five entity list/detail pages (Departamento, Cargo, Vaga, Candidato,
Triagem), provides domain-specific form and table components, and exposes a shared
component library (`src/components/ui/`). All reads happen inside Server Components;
all mutations are delegated to Server Actions via form bindings.

Not responsible for: mutations (→ layer-actions), external HTTP endpoints
(→ layer-api), schema definitions (→ layer-db), or validation logic
(→ layer-validation).

### Where does it live?

- `src/app/(rh)/` — route group. Folders prefixed with `_` are opted out of routing by Next.js — use `_components/` inside each route segment for entity-specific components:
  - `candidatos/page.tsx`, `candidatos/_components/table.tsx`, `candidatos/_components/form.tsx`
  - `candidatos/[id]/page.tsx`, `candidatos/[id]/_components/form.tsx`
  - same pattern for `departamentos/`, `cargos/`, `vagas/`, `triagens/`
- `src/components/ui/` — shadcn installed source files — **never modify**
- `src/components/domain/` — shared base primitives used across multiple entity pages: a styled `DataTable` that all entity tables extend, a styled `FormCard` that all forms wrap, etc. Promote a component here only when a second route needs it.
- `src/components/domain/shared/` — shared domain display wrappers: `ResultadoBadge`, `EtapaBadge`, and similar cross-entity components.

### Building blocks

- **RHPages** — Server Component pages for all five entities, with Suspense boundaries around join-heavy lists. See [Reference](references/rh-pages.md).
- **DomainComponents** — Entity-specific components in `_components/` inside each route segment; shared base primitives (styled DataTable, FormCard) in `src/components/domain/`. See [Reference](references/domain-components.md).
- **SharedUIComponents** — Shared custom wrappers over shadcn primitives in `src/components/domain/shared/`. See [Reference](references/shared-ui-components.md).

### Hard rules

- Every `page.tsx` is a Server Component — no `'use client'` at the page level.
- Every read must go through `notDeleted()` from `src/server/db/query-helpers.ts` — no inline `isNull` checks.
- No client-side data fetching (`fetch`, SWR, React Query) — all reads inside Server Components.
- No parallel routes, intercepting routes, or modals for the MVP — plain nested pages only.
- Wrap any join-heavy list in a `<Suspense>` boundary (e.g. the triagens pipeline joining Candidato, Vaga, Cargo, AvaliacaoIA).
- Option lists for FK selects (Departamento → Cargo, Cargo → Vaga, etc.) must be server-fetched and already filtered through `notDeleted()` — never fetched client-side.
- The `Triagem` form must show `motivo` only when `resultado` is `reprovado` or `desistente`, constrained to the matching subset.
- `src/components/ui/` contains shadcn source files installed by the CLI — never edit them.
- Entity-specific components (candidato table, candidato form) go in `_components/` inside the route segment, not in `src/components/domain/`.
- Promote a component to `src/components/domain/` only when a second route needs it — it is a shared base primitive (styled DataTable, FormCard), not an entity-specific component.
- Apply Tailwind overrides over shadcn primitives in `src/components/domain/` wrappers — never in the shadcn source.

---

## Workflow

Work here when adding a new page, modifying a form field, or updating a list view.

1. For reads: add the Drizzle query inside the `async` Server Component, always wrapped in `notDeleted()`. See [RHPages](references/rh-pages.md).
2. For new components: create them in `src/app/(rh)/<entity>/_components/`. Move to `src/components/domain/` only when a second route imports the same component. See [DomainComponents](references/domain-components.md).
3. For FK option lists: server-fetch and pass as props from the parent Server Component — no client fetch.
4. Wrap slow multi-join queries in `<Suspense fallback={<Skeleton />}>`.

---

## References

- [RHPages](references/rh-pages.md)
- [DomainComponents](references/domain-components.md)
- [SharedUIComponents](references/shared-ui-components.md)
