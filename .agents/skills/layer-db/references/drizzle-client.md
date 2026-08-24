# DrizzleClient

The singleton Drizzle ORM instance that connects to PostgreSQL. All database
queries flow through this singleton — it is the only place in the codebase where
the connection pool is created.

## Responsibilities

Creates and exports a single `db` Drizzle instance backed by a `postgres-js`
connection pool, reading `DATABASE_URL` from the environment. Imports the schema
so Drizzle's relational query API is available.

Not responsible for: schema definitions (→ DrizzleSchema), query patterns
(→ QueryHelpers), or any business logic.

### Where does it live?

`src/server/db/index.ts`

### Building blocks

No sub-artifacts.

### Structural convention

```ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '~/env';
import * as schema from './schema';

const client = postgres(env.DATABASE_URL);
export const db = drizzle(client, { schema });
```

Import everywhere else as: `import { db } from '~/server/db'`

### Hard rules

- Never create a second Drizzle instance anywhere in the codebase.
- Never import `postgres` or `drizzle` outside `src/server/db/index.ts`.
- Keep this file minimal — no query logic, no business logic.

---

## Workflow

Rarely changes. Touch only when switching the connection driver or adding schema modules.

1. Confirm `DATABASE_URL` is declared in `src/env.js` and set in `.env.local`.
2. If adding new schema files, import and merge them into the `schema` spread.

---

## References

Related skills:
- [drizzle-orm-patterns](../../drizzle-orm-patterns/SKILL.md)

Real implementations:
- `src/server/db/index.ts`
