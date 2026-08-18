---
name: layer-validation
description: >-
  Owns all Zod schemas for the triagem HR platform: one schema per domain entity
  (departamento, cargo, vaga, candidato, triagem). Load when touching
  src/lib/validation/*.ts, when adding or modifying form fields, or when changing
  allowed enum values. Trigger terms: Zod, schema, parse, safeParse, z.object,
  z.enum, z.string, z.uuid, superRefine, validation error, form validation,
  criarDepartamentoSchema, criarTriagemSchema. Do NOT load for Drizzle table
  definitions (→ layer-db) or Server Action business logic (→ layer-actions).
---

# Validation Layer

Owns all runtime type-safety at system boundaries: Zod schemas that validate form
input arriving via Server Actions and external payloads arriving via Route
Handlers. Uses `drizzle-zod` to derive base schemas directly from the Drizzle
table definitions, then extends or refines them with business rules. Sits above
`layer-db` and is consumed by both `layer-actions` and `layer-api`.

## Responsibilities

Defines and exports one Zod schema file per entity (create and update variants
where shapes differ). Uses `createInsertSchema` / `createSelectSchema` from `drizzle-zod`
to derive base schemas from the Drizzle table so column types and enum values never
have to be declared twice. Extends the base schema with business-level constraints
(e.g. the `triagem` motivo pairing rule via `.superRefine()`).

Not responsible for: Drizzle mutations (→ layer-actions), HTTP route wiring
(→ layer-api), or UI rendering (→ layer-ui).

### Where does it live?

Server schemas (used by Server Actions and Route Handlers):
- `src/lib/validation/departamento.ts`
- `src/lib/validation/cargo.ts`
- `src/lib/validation/vaga.ts`
- `src/lib/validation/candidato.ts`
- `src/lib/validation/triagem.ts`

Client schemas (used by TanStack Form; extend server schemas with Portuguese error messages):
- `src/lib/validation/departamento.client.ts`
- `src/lib/validation/cargo.client.ts`
- `src/lib/validation/vaga.client.ts`
- `src/lib/validation/candidato.client.ts`
- `src/lib/validation/triagem.client.ts`

### Building blocks

- **EntitySchema** — Per-entity Zod schemas (departamento, cargo, vaga, candidato, triagem) with create and update variants. See [Reference](references/entity-schema.md).
- **ClientFormSchema** — Client-side extensions of EntitySchema with Portuguese error messages for TanStack Form. Live in `*.client.ts` files alongside the server schema. See [Reference](references/entity-schema.md#client-schema).

### Hard rules

- Always derive the base schema with `createInsertSchema(table)` from `drizzle-zod` — never redeclare column types or enum values by hand.
- Then `.pick()` only the user-submittable fields (exclude `id`, `createdAt`, `updatedAt`, `deletedAt`).
- Extend or refine the picked schema to add any business constraints not derivable from the column definition (e.g. `.superRefine()` for the triagem motivo coupling rule).
- The `triagem` schema must enforce: `motivo` constrained to the reprovado-subset when `resultado === 'reprovado'`; to the desistente-subset when `resultado === 'desistente'`; `null` otherwise.
- Never import from `drizzle-orm` directly — import tables from `@/server/db/schema` and schema helpers from `'drizzle-orm/zod'`.
- These schemas are the shared contract between Server Actions and Route Handlers — do not duplicate validation logic inline in either.
- Always export both the schema constant and its inferred TypeScript type.
- Client schemas (`*.client.ts`) **extend** the server schema using `.extend()` (for standard entities) or re-apply the coupling rule on `triagemPickedBase` (for triagem). They are **only** imported by TanStack Form components — never by Server Actions or Route Handlers.
- Do not import `*.client.ts` files from server code — they exist only for the browser validation layer.

---

## Workflow

Work here when adding a new entity or changing field constraints.

1. Import the Drizzle table from `@/server/db/schema`.
2. Call `createInsertSchema(table)` from `drizzle-zod` to get the base schema.
3. `.pick()` the user-submittable fields, then add any business constraints with `.extend()` or `.superRefine()`. See [EntitySchema](references/entity-schema.md).
4. Export a named schema (e.g. `criarDepartamentoSchema`) and its inferred TypeScript type.
5. Import the schema in the relevant `src/actions/<entity>.ts` or `src/app/api/` route — never duplicate the schema logic there.
6. If a form uses TanStack Form, create a `src/lib/validation/<entity>.client.ts` that extends the server schema with Portuguese error messages. See [EntitySchema — Client Schema](references/entity-schema.md#client-schema).

---

## References

- [EntitySchema](references/entity-schema.md)
