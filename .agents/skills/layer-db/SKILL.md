---
name: layer-db
description: >-
  Owns all Drizzle ORM artifacts: table schema definitions for the 9 triagem
  domain entities (Departamento, Cargo, Vaga, Candidato, CandidatoFormacao,
  CandidatoExperienciaProfissional, CandidatoCertificacao, Triagem, AvaliacaoIA)
  plus the 2 agent-engine config tables (LlmCredencial, AgenteConfig — see
  ADR-0007, not part of docs/db_triagem_proposta.ts), the Drizzle client
  singleton, the notDeleted() query helper, hydrated projection types
  (CandidatoCompleto, VagaCompleta, TriagemCompleta), and one Repository
  module per entity that centralises all Drizzle queries. Load when touching
  src/server/db/schema.ts, src/server/db/index.ts, src/server/db/query-helpers.ts, or any file under
  src/server/db/repositories/. Trigger terms: schema, Drizzle, notDeleted, soft delete,
  table, migration, query helper, hydrated type, repository, findAll, findById,
  softDelete, pgTable, timestamps. Do NOT load for Zod validation
  (→ layer-validation), file storage (→ layer-storage), or UI pages (→ layer-ui).
---

# Database Layer

Owns the complete Drizzle ORM surface for the triagem HR platform: all 9 table
definitions, the client singleton, shared query builder helpers, and read-model
projection types. Every other layer that needs data reads or writes imports from
this layer — no other layer imports from `drizzle-orm` directly.

## Responsibilities

Defines the authoritative data model (9 tables, all with soft-delete via the
`timestamps` helper), exports a singleton Drizzle client, provides `notDeleted()`
which every query must call, exports TypeScript hydrated aggregate types, and owns
one Repository module per entity that is the single source for all Drizzle queries
against that entity. Callers (actions, route handlers, pages) import from
repositories — never issue raw Drizzle queries themselves.

Not responsible for: validation rules (→ layer-validation), file storage
(→ layer-storage), mutation orchestration (→ layer-actions), external HTTP
endpoints (→ layer-api), or UI rendering (→ layer-ui).

### Where does it live?

- `src/server/db/schema.ts` — all Drizzle table definitions (9 tables + `timestamps` helper) and hydrated types
- `src/server/db/index.ts` — Drizzle client singleton
- `src/server/db/query-helpers.ts` — `notDeleted()` and other shared query builders
- `src/server/db/repositories/` — one file per entity (departamento, cargo, vaga, candidato, candidato-formacao, candidato-experiencia, candidato-certificacao, triagem, avaliacao-ia)

### Building blocks

- **DrizzleSchema** — Table definitions for all 9 entities, derived from `docs/db_triagem_proposta.ts`. See [Reference](references/drizzle-schema.md).
- **DrizzleClient** — Singleton Drizzle instance backed by a PostgreSQL connection pool. See [Reference](references/drizzle-client.md).
- **QueryHelpers** — `notDeleted()` and any other reusable query builder helpers. See [Reference](references/query-helpers.md).
- **HydratedTypes** — TypeScript projection types: `CandidatoCompleto`, `VagaCompleta`, `TriagemCompleta`. See [Reference](references/hydrated-types.md).
- **Repository** — One query-centralisation module per entity; the only place raw Drizzle calls are written. See [Reference](references/repository.md).

### Hard rules

- All Drizzle queries live in repositories — no `db.select()`, `db.insert()`, `db.update()` calls outside `src/server/db/repositories/`.
- Always use `notDeleted()` inside repository read methods — never `.where(isNull(...))` inline.
- Never issue a real `DELETE` — soft delete only (`deletedAt = new Date()`).
- Soft-delete cascade is orchestrated by `layer-actions` (in a transaction), calling individual repository soft-delete methods — never rely on Postgres `ON DELETE CASCADE`.
- Repository methods that need to participate in a caller's transaction accept an optional `tx` parameter that defaults to `db`.
- Unique constraints on `Departamento.nome` and `Candidato.email` are plain `UNIQUE` (not partial) — a soft-deleted row still blocks reuse.
- Every table must spread `...timestamps`.
- Only `layer-db` imports from `drizzle-orm` directly. All other layers import from `~/server/db` or `~/server/db/repositories/`.

---

## Workflow

Work in this layer when adding a new table, changing a column, adding a query, or adding a shared query helper.

1. Check `docs/db_triagem_proposta.ts` for canonical field names, types, and enum values before writing anything.
2. Add or update the table definition in `src/server/db/schema.ts` using `...timestamps`. See [DrizzleSchema](references/drizzle-schema.md).
3. Export inferred TypeScript types (`$inferSelect`, `$inferInsert`) for each new table.
4. Add or update the corresponding repository in `src/server/db/repositories/<entity>.ts`. See [Repository](references/repository.md).
5. If the entity participates in a composite read model, add or update the hydrated type. See [HydratedTypes](references/hydrated-types.md).
6. If a query utility is needed across multiple repositories, add it to `src/server/db/query-helpers.ts`. See [QueryHelpers](references/query-helpers.md).

---

## References

- [DrizzleSchema](references/drizzle-schema.md)
- [DrizzleClient](references/drizzle-client.md)
- [QueryHelpers](references/query-helpers.md)
- [HydratedTypes](references/hydrated-types.md)
- [Repository](references/repository.md)
