# QueryHelpers

Shared Drizzle query builder helpers that enforce project-wide constraints. The
most critical one, `notDeleted()`, must be applied to every `select` so the
soft-delete filter cannot be forgotten by any caller.

## Responsibilities

Exports `notDeleted(qb, table)` which appends the soft-delete filter to any
Drizzle query builder, and any other helpers that must be applied consistently
(e.g. ordering, pagination). Acts as the single enforcement point for the
soft-delete contract across all reads.

Not responsible for: table definitions (→ DrizzleSchema), business logic
(→ layer-actions), or entity-specific query composition (that is fine inline in
pages/actions, as long as `notDeleted()` is always called).

### Where does it live?

`src/server/db/query-helpers.ts`

### Building blocks

No sub-artifacts.

### Structural convention

```ts
import { isNull } from 'drizzle-orm';

export function notDeleted<TTable extends { deletedAt: unknown }>(
  qb: any,
  table: TTable,
) {
  return qb.where(isNull((table as any).deletedAt));
}
```

Usage in a Server Component:
```ts
import { db } from '~/server/db';
import { departamentos } from '~/server/db/schema';
import { notDeleted } from '~/server/db/query-helpers';

const rows = await notDeleted(db.select().from(departamentos), departamentos);
```

### Hard rules

- Never bypass `notDeleted()` — no inline `.where(isNull(table.deletedAt))` anywhere outside this file.
- `notDeleted()` must remain generic (accept any table with a `deletedAt` column).

---

## Workflow

Add a new helper here when the same `.where(...)` or `.orderBy(...)` clause appears in more than two places across pages and actions.

1. Define the helper with a generic parameter matching the required table shape.
2. Export from `src/server/db/query-helpers.ts`.
3. Replace all inline duplicates with the new helper call.

---

## References

Related skills:
- [drizzle-orm-patterns](../../drizzle-orm-patterns/SKILL.md)

Real implementations:
- `src/server/db/query-helpers.ts`
