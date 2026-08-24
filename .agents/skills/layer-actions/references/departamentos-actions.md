# DepartamentosActions

Server Actions for `Departamento` CRUD: create, update, and soft-delete.
`Departamento` is the root of the FK hierarchy — it has no FK parent and no
children that require cascade soft-delete (Cargo owns its own soft-delete).

## Responsibilities

Validates input with `criarDepartamentoSchema` / `editarDepartamentoSchema`,
runs Drizzle insert/update/soft-delete on `departamentos`, calls
`revalidatePath('/departamentos')`, and returns typed results. Catches the
`UNIQUE` violation on `nome` and surfaces it as a structured error.

Not responsible for: Cargo mutations triggered by a Departamento change
(→ CargosActions), or rendering (→ layer-ui).

### Where does it live?

`src/actions/departamentos.ts`

### Building blocks

No sub-artifacts.

### Structural convention

```ts
'use server';
import { departamentoRepository } from '~/server/db/repositories/departamento';
import { criarDepartamentoSchema, editarDepartamentoSchema } from '~/lib/validation/departamento';
import { revalidatePath } from 'next/cache';

export async function criarDepartamento(formData: FormData) {
  const parsed = criarDepartamentoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  try {
    const row = await departamentoRepository.create(parsed.data);
    revalidatePath('/departamentos');
    return { success: true, data: row };
  } catch (e: any) {
    if (e.code === '23505') return { success: false, error: 'nome_em_uso' };
    throw e;
  }
}

export async function editarDepartamento(id: string, formData: FormData) {
  const parsed = editarDepartamentoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  try {
    const row = await departamentoRepository.update(id, parsed.data);
    revalidatePath('/departamentos');
    revalidatePath(`/departamentos/${id}`);
    return { success: true, data: row };
  } catch (e: any) {
    if (e.code === '23505') return { success: false, error: 'nome_em_uso' };
    throw e;
  }
}

export async function deletarDepartamento(id: string) {
  await departamentoRepository.softDelete(id);
  revalidatePath('/departamentos');
  return { success: true };
}
```

### Hard rules

- Catch Postgres error code `23505` on `nome` and return `{ success: false, error: 'nome_em_uso' }` — a soft-deleted Departamento with the same name still occupies the unique slot.
- Never hard-delete.

---

## Workflow

1. Update `src/lib/validation/departamento.ts` if a field changes.
2. Add or update the action function in `src/actions/departamentos.ts`.
3. Call `revalidatePath('/departamentos')` (and `/departamentos/[id]` for edit) after mutation.

---

## References

- [CargosActions](cargos-actions.md)
- [../../layer-validation/references/entity-schema.md](../../layer-validation/references/entity-schema.md)
- [../../layer-db/references/drizzle-schema.md](../../layer-db/references/drizzle-schema.md)

Real implementations:
- `src/actions/departamentos.ts`
