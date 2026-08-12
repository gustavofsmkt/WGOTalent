# DrizzleSchema

The Drizzle table definitions for all 9 entities in the triagem domain. This is
the single source of truth for column names, types, constraints, enums, and
foreign keys — the TypeScript counterpart to `docs/db_triagem_proposta.ts`.

## Responsibilities

Declares every table (`departamentos`, `cargos`, `vagas`, `candidatos`,
`candidato_formacoes`, `candidato_experiencias`, `candidato_certificacoes`,
`triagens`, `avaliacao_ia`) with correct Drizzle column types, pgEnums, foreign
keys, and the shared `timestamps` helper. Exports `$inferSelect` and
`$inferInsert` types for each table.

Not responsible for: validation rules (→ layer-validation EntitySchema), business
constraints enforced in code (→ layer-actions), or projection types that join
multiple tables (→ HydratedTypes).

### Where does it live?

`src/server/db/schema.ts`

### Building blocks

No sub-artifacts. Related: [HydratedTypes](hydrated-types.md), [QueryHelpers](query-helpers.md).

### Structural convention

```ts
import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, smallint, pgEnum } from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
};

export const departamentos = pgTable('departamentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: varchar('nome', { length: 120 }).notNull().unique(),
  descricao: text('descricao').notNull(),
  ...timestamps,
});
export type Departamento = typeof departamentos.$inferSelect;
export type NovoDepartamento = typeof departamentos.$inferInsert;

export const etapaEnum = pgEnum('etapa', [
  'curriculo', 'testes', 'entrevista_rh', 'entrevista_gestor', 'finalizado',
]);
export const resultadoEnum = pgEnum('resultado', [
  'em_andamento', 'aprovado', 'reprovado', 'desistente', 'banco_talentos',
]);
// Remaining enums and tables follow the same pattern.
```

### Hard rules

- Every table must spread `...timestamps` — no exceptions.
- Enum values must match the string literals in `docs/db_triagem_proposta.ts` exactly.
- Foreign keys must be indexed (`references()` + `.notNull()` as appropriate).
- Never redefine `createdAt`, `updatedAt`, or `deletedAt` outside `timestamps`.

---

## Workflow

Add or modify a table when the schema changes.

1. Open `docs/db_triagem_proposta.ts` and copy exact field names and types.
2. Add the `pgTable` block in `src/server/db/schema.ts` with `...timestamps`.
3. Export `type <Entity> = typeof <table>.$inferSelect` and `type Novo<Entity> = typeof <table>.$inferInsert`.
4. Run Drizzle migrations (`drizzle-kit generate` + `drizzle-kit migrate`).

---

## References

- [HydratedTypes](hydrated-types.md)
- [QueryHelpers](query-helpers.md)

Related skills:
- [drizzle-orm-patterns](../../drizzle-orm-patterns/SKILL.md)

Real implementations:
- `src/server/db/schema.ts`
- `docs/db_triagem_proposta.ts` (canonical field names — always check first)
