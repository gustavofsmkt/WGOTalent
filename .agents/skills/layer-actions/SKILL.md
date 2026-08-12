---
name: layer-actions
description: >-
  Owns all 'use server' Server Actions — the single internal mutation boundary
  for the triagem HR platform. Load when touching actions/departamentos.ts,
  actions/cargos.ts, actions/vagas.ts, actions/candidatos.ts, or
  actions/triagens.ts, or when adding any form submission, soft delete, or
  cascade. Trigger terms: Server Action, 'use server', criarDepartamento,
  editarCargo, softDelete, deletarCandidato, cascade, revalidatePath, form action,
  action binding. Do NOT load for Route Handlers (→ layer-api) or UI form
  components that merely bind these actions (→ layer-ui).
---

# Actions Layer

Owns every `'use server'` function in the application — the single internal
boundary through which all form-driven mutations (creates, edits, soft deletes)
flow. Actions validate input with `layer-validation` schemas, call repository
methods from `layer-db` for all DB reads and writes, call `StorageProvider` from
`layer-storage` where file operations are needed, and call `revalidatePath` to
invalidate the Next.js cache. Actions never issue raw Drizzle queries.

## Responsibilities

Implements Server Actions for all five top-level entities: Departamento, Cargo,
Vaga, Candidato (including Formacao / Experiencia / Certificacao sub-mutations
and the cascade soft-delete), and Triagem. Each action validates input, calls the
appropriate repository method, and returns a typed
`{ success: true, data } | { success: false, error }` result.

Not responsible for: external HTTP mutations (→ layer-api), schema definitions
(→ layer-db), Zod schema definitions (→ layer-validation), file storage interface
(→ layer-storage), or rendering (→ layer-ui).

### Where does it live?

- `src/actions/departamentos.ts`
- `src/actions/cargos.ts`
- `src/actions/vagas.ts`
- `src/actions/candidatos.ts` — includes Formacao / Experiencia / Certificacao
  sub-mutations and the cascade soft-delete
- `src/actions/triagens.ts`

### Building blocks

- **DepartamentosActions** — CRUD Server Actions for `Departamento`. See [Reference](references/departamentos-actions.md).
- **CargosActions** — CRUD Server Actions for `Cargo`. See [Reference](references/cargos-actions.md).
- **VagasActions** — CRUD Server Actions for `Vaga`. See [Reference](references/vagas-actions.md).
- **CandidatosActions** — CRUD + cascade soft-delete Server Actions for `Candidato` and all its sub-entities. See [Reference](references/candidatos-actions.md).
- **TriagensActions** — CRUD Server Actions for `Triagem`. See [Reference](references/triagens-actions.md).

### Hard rules

- Every file must begin with `'use server'`.
- Every action must validate input with the matching Zod schema from `src/lib/validation/` via `.safeParse()` — never trust raw form data.
- Every action must return `{ success: true, data } | { success: false, error }` — no thrown errors surfaced to the client.
- Every mutating action must call `revalidatePath()` for the affected list and detail routes.
- Never issue raw Drizzle queries (`db.select`, `db.insert`, `db.update`) — always call repository methods from `src/server/db/repositories/`.
- Soft delete = call `<entity>Repository.softDelete(id)`. Never issue a real `DELETE`.
- `deletarCandidato` orchestrates the cascade by calling each sub-entity repository's `softDeleteByCandidatoId(id, tx)` inside a single `db.transaction(tx)` — never rely on Postgres `ON DELETE CASCADE`.
- Catch `UNIQUE` constraint violations on `Departamento.nome` and `Candidato.email` and return `{ success: false, error: '<field>_em_uso' }` — soft-deleted rows still block reuse.

---

## Workflow

Work here when adding a new mutation (create, edit, or soft-delete) for any entity.

1. Confirm the Zod schema exists in `src/lib/validation/<entity>.ts` — create it first if not. See [layer-validation](../layer-validation/SKILL.md).
2. Open `src/actions/<entity>.ts`; add `'use server'` at the top if the file is new.
3. Write the action: parse input with `schema.safeParse()`, call the repository method, call `revalidatePath`, return the typed result.
4. For soft-delete cascade, call each sub-entity repository inside a `db.transaction(tx)`. See [CandidatosActions](references/candidatos-actions.md) for the cascade pattern.

---

## References

- [DepartamentosActions](references/departamentos-actions.md)
- [CargosActions](references/cargos-actions.md)
- [VagasActions](references/vagas-actions.md)
- [CandidatosActions](references/candidatos-actions.md)
- [TriagensActions](references/triagens-actions.md)
