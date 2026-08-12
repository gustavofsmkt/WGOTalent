# HydratedTypes

TypeScript projection types that represent multi-table joins used by pages and
actions. These are read models that express what the UI needs to display, not
what individual database rows store.

## Responsibilities

Defines `CandidatoCompleto`, `VagaCompleta`, and `TriagemCompleta` as TypeScript
interfaces that extend or compose the base Drizzle-inferred entity types. Used as
return-type annotations for queries assembled in Server Components and as input
shapes for actions that operate on joined data.

Not responsible for: the Drizzle queries that produce these shapes (composed
inline in each Server Component), or the Zod schemas that validate input
(→ layer-validation EntitySchema).

### Where does it live?

`src/server/db/schema.ts` (exported alongside the table definitions). Move to
`src/server/db/types.ts` only if `schema.ts` becomes unwieldy.

### Building blocks

No sub-artifacts. Related: [DrizzleSchema](drizzle-schema.md).

### Structural convention

```ts
// In src/server/db/schema.ts
export interface CandidatoCompleto extends Candidato {
  formacoes: CandidatoFormacao[];
  experiencias: CandidatoExperienciaProfissional[];
  certificacoes: CandidatoCertificacao[];
}

export interface VagaCompleta extends Vaga {
  cargo: Cargo & { departamento: Departamento };
}

export interface TriagemCompleta extends Triagem {
  candidato: Candidato;
  vaga: VagaCompleta;
  avaliacao_ia: AvaliacaoIA | null;
}
```

These mirror the aggregates defined in `docs/db_triagem_proposta.ts`.

### Hard rules

- Names and shapes must stay in sync with `docs/db_triagem_proposta.ts`.
- Never embed query logic in these type definitions — they are pure TypeScript interfaces.
- `avaliacao_ia` on `TriagemCompleta` is `AvaliacaoIA | null` (not every Triagem has one).

---

## Workflow

Add a hydrated type when a page or action needs a consistent multi-table shape that would otherwise be inlined and repeated.

1. Define the interface in `src/server/db/schema.ts` (or `src/server/db/types.ts`).
2. Build the Drizzle query that produces the shape inside the Server Component itself.
3. Annotate the query return type with the hydrated interface.

---

## References

- [DrizzleSchema](drizzle-schema.md)

Related skills:
- [drizzle-orm-patterns](../../drizzle-orm-patterns/SKILL.md)

Real implementations:
- `src/server/db/schema.ts`
- `docs/db_triagem_proposta.ts` (authoritative aggregate shapes)
