# CargosActions

Server Actions for `Cargo` CRUD: create, update, and soft-delete. `Cargo` has a
required FK to `Departamento` — every mutation receives a `departamento_id`.

## Responsibilities

Validates input (including `departamento_id` as a UUID), runs Drizzle mutations
on `cargos`, calls `revalidatePath('/cargos')`. The `ativo` flag is a regular
field — toggling it is a plain update, not a status machine.

Not responsible for: cascading to `Vaga` when a Cargo is soft-deleted (Vaga has
its own soft-delete in → VagasActions), or fetching the Departamento option list
for forms (→ layer-ui RHPages).

### Where does it live?

`src/actions/cargos.ts`

### Building blocks

No sub-artifacts.

### Structural convention

```ts
'use server';
import { cargoRepository } from '@/server/db/repositories/cargo';
import { criarCargoSchema } from '@/lib/validation/cargo';
import { revalidatePath } from 'next/cache';

export async function criarCargo(formData: FormData) {
  const parsed = criarCargoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  try {
    const row = await cargoRepository.create(parsed.data);
    revalidatePath('/cargos');
    return { success: true, data: row };
  } catch (e: any) {
    if (e.code === '23503') return { success: false, error: 'departamento_nao_encontrado' };
    throw e;
  }
}

export async function deletarCargo(id: string) {
  await cargoRepository.softDelete(id);
  revalidatePath('/cargos');
  return { success: true };
}
```

### Hard rules

- `departamento_id` must be validated as `z.string().uuid()` in the Zod schema.
- Catch Postgres error code `23503` (FK violation) on `departamento_id` and return a structured error.
- Never hard-delete.

---

## Workflow

1. Ensure `src/lib/validation/cargo.ts` includes all needed fields.
2. Add or update functions in `src/actions/cargos.ts`.
3. Call `revalidatePath('/cargos')` (and `/cargos/[id]` for edit) after mutation.

---

## References

- [DepartamentosActions](departamentos-actions.md)
- [VagasActions](vagas-actions.md)
- [../../layer-validation/references/entity-schema.md](../../layer-validation/references/entity-schema.md)
- [../../layer-db/references/drizzle-schema.md](../../layer-db/references/drizzle-schema.md)

Real implementations:
- `src/actions/cargos.ts`
