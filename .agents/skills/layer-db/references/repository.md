# Repository

A plain module of Drizzle query functions for one entity — the single place
where raw `db.*` calls for that entity are written. This is not the Fowler
Repository Interface pattern: there is no abstract interface and no dependency
injection. The purpose is purely to centralise queries so they are never
scattered across actions, route handlers, or pages.

## Responsibilities

Owns every read and write query for one entity: `findAll`, `findById`, `create`,
`update`, `softDelete`, and any entity-specific query variants. All read methods
call `notDeleted()`. Methods that may run inside a caller's transaction accept an
optional `tx` parameter (defaults to `db`).

Not responsible for: orchestrating multi-entity transactions (→ layer-actions),
validation of user input (→ layer-validation), file I/O (→ layer-storage), or
HTTP routing (→ layer-api).

### Where does it live?

```
src/server/db/repositories/
  departamento.ts
  cargo.ts
  vaga.ts
  candidato.ts
  candidato-formacao.ts
  candidato-experiencia.ts
  candidato-certificacao.ts
  triagem.ts
  avaliacao-ia.ts
```

One file per entity. Sub-entity repositories (candidato-formacao, etc.) follow
the same shape and expose a `softDeleteByCandidatoId(id, tx?)` method so
`layer-actions` can cascade without writing raw queries.

### Building blocks

No sub-artifacts. Related: [QueryHelpers](query-helpers.md), [DrizzleSchema](drizzle-schema.md).

### Structural convention

```ts
// src/server/db/repositories/departamento.ts
import { db } from '@/server/db';
import { departamentos, type Departamento, type NovoDepartamento } from '@/server/db/schema';
import { notDeleted } from '@/server/db/query-helpers';
import { eq } from 'drizzle-orm';

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type DbOrTx = typeof db | Tx;

export const departamentoRepository = {
  findAll: (dbOrTx: DbOrTx = db) =>
    notDeleted(dbOrTx.select().from(departamentos), departamentos),

  findById: async (id: string, dbOrTx: DbOrTx = db): Promise<Departamento | null> => {
    const rows = await notDeleted(dbOrTx.select().from(departamentos), departamentos)
      .where(eq(departamentos.id, id));
    return rows[0] ?? null;
  },

  create: (data: NovoDepartamento, dbOrTx: DbOrTx = db) =>
    dbOrTx.insert(departamentos).values(data).returning().then(r => r[0]),

  update: (id: string, data: Partial<NovoDepartamento>, dbOrTx: DbOrTx = db) =>
    dbOrTx.update(departamentos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(departamentos.id, id))
      .returning()
      .then(r => r[0]),

  softDelete: (id: string, dbOrTx: DbOrTx = db) =>
    dbOrTx.update(departamentos)
      .set({ deletedAt: new Date() })
      .where(eq(departamentos.id, id)),
};
```

Sub-entity repository (supports cascade participation):
```ts
// src/server/db/repositories/candidato-formacao.ts
export const candidatoFormacaoRepository = {
  softDeleteByCandidatoId: (candidatoId: string, dbOrTx: DbOrTx = db) =>
    dbOrTx.update(candidatoFormacoes)
      .set({ deletedAt: new Date() })
      .where(eq(candidatoFormacoes.candidatoId, candidatoId)),
};
```

Usage in a Server Action (cascade orchestration stays in `layer-actions`):
```ts
await db.transaction(async tx => {
  await candidatoFormacaoRepository.softDeleteByCandidatoId(id, tx);
  await candidatoExperienciaRepository.softDeleteByCandidatoId(id, tx);
  await candidatoCertificacaoRepository.softDeleteByCandidatoId(id, tx);
  const triagemIds = await triagemRepository.findIdsByCandidatoId(id, tx);
  await avaliacaoIaRepository.softDeleteByTriagemIds(triagemIds, tx);
  await triagemRepository.softDeleteByCandidatoId(id, tx);
  const candidato = await candidatoRepository.softDelete(id, tx);
  // storage.delete stays in the action (storage is not a db concern)
});
```

### Hard rules

- Every read method must call `notDeleted()` — never issue a select without it.
- Every method that might run inside a transaction must accept `dbOrTx: DbOrTx = db`.
- Export a single named object per file (`departamentoRepository`, etc.) — no default exports.
- No business logic inside repositories — just Drizzle queries. No validation, no `revalidatePath`, no storage calls.
- No Zod imports — that belongs in `layer-validation`.

---

## Workflow

Add or update a repository when adding a new entity or a new query for an existing entity.

1. Create `src/server/db/repositories/<entity>.ts`.
2. Import the table and types from `@/server/db/schema`.
3. Implement standard methods (`findAll`, `findById`, `create`, `update`, `softDelete`).
4. For sub-entities, add `softDeleteBy<Parent>Id(parentId, dbOrTx?)` to support cascade.
5. Export the repository as a named `const` object.

---

## References

- [QueryHelpers](query-helpers.md)
- [DrizzleSchema](drizzle-schema.md)
- [../../layer-actions/references/candidatos-actions.md](../../layer-actions/references/candidatos-actions.md)

Related skills:
- [drizzle-orm-patterns](../../drizzle-orm-patterns/SKILL.md)

Real implementations:
- `src/server/db/repositories/` (directory — no files exist at scaffold time)
