# RHPages

The Next.js App Router pages under `src/app/(rh)/` — one list page and one detail/edit
page per entity. All are Server Components that fetch data directly from Drizzle
at render time, always through `notDeleted()`.

## Responsibilities

Fetches entity data filtered by `notDeleted()`, renders list or detail views,
passes Server Actions to child form components as props, fetches FK option lists
(e.g. Departamentos for the Cargo form) in the same Server Component. Wraps
join-heavy queries in Suspense boundaries.

Not responsible for: form fields themselves (→ DomainComponents), shared UI
primitives (→ SharedUIComponents), or any mutation logic (→ layer-actions).

### Where does it live?

```
src/app/(rh)/
  departamentos/page.tsx        # list
  departamentos/[id]/page.tsx   # detail + edit
  cargos/page.tsx
  cargos/[id]/page.tsx
  vagas/page.tsx
  vagas/[id]/page.tsx
  candidatos/page.tsx
  candidatos/[id]/page.tsx      # includes formacoes, experiencias, certificacoes, triagens
  triagens/page.tsx             # pipeline view, filterable by etapa/resultado/motivo
  triagens/[id]/page.tsx        # detail + avaliacao_ia shown inline (read-only)
```

### Building blocks

No sub-artifacts. Related: [DomainComponents](domain-components.md).

### Structural convention

```tsx
// src/app/(rh)/departamentos/page.tsx
import { db } from '~/server/db';
import { departamentos } from '~/server/db/schema';
import { notDeleted } from '~/server/db/query-helpers';
import { DepartamentosTable } from './_components/table';
import { criarDepartamento } from '~/actions/departamentos';

export default async function DepartamentosPage() {
  const rows = await notDeleted(db.select().from(departamentos), departamentos);
  return <DepartamentosTable rows={rows} onCreate={criarDepartamento} />;
}
```

Parallel fetch pattern for a detail page that needs an FK option list:
```tsx
const [vaga, cargoOptions] = await Promise.all([
  db.select().from(vagas).where(eq(vagas.id, params.id)).then(r => r[0]),
  notDeleted(db.select({ id: cargos.id, titulo: cargos.titulo }).from(cargos), cargos),
]);
```

### Hard rules

- Every data fetch must call `notDeleted()` — no exceptions.
- Never add `'use client'` to a page file.
- The `avaliacao_ia` on the Triagem detail page is read-only and shown inline — no separate route or CRUD for AvaliacaoIA.
- Wrap the triagens list in a `<Suspense>` boundary (it joins Candidato, Vaga, Cargo, and AvaliacaoIA).

---

## Workflow

1. Create `src/app/(rh)/<entity>/page.tsx` as an `async` function (Server Component).
2. Fetch data with Drizzle, always through `notDeleted()`.
3. Fetch FK option lists in the same component using `Promise.all` to avoid waterfall.
4. Wrap slow joins in `<Suspense fallback={...}>`.

---

## References

- [DomainComponents](domain-components.md)
- [../../layer-db/references/query-helpers.md](../../layer-db/references/query-helpers.md)
- [../../layer-actions/references/departamentos-actions.md](../../layer-actions/references/departamentos-actions.md)

Related skills:
- [nextjs-app-router-patterns](../../nextjs-app-router-patterns/SKILL.md)

Real implementations:
- `src/app/(rh)/` (directory — no files exist at scaffold time)
