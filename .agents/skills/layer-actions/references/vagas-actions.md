# VagasActions

Server Actions for `Vaga` CRUD: create, update, and soft-delete. `Vaga` has a
required FK to `Cargo` (which chains to `Departamento`).

## Responsibilities

Validates input including `cargo_id` and `posicoes_disponiveis` (must be > 0),
runs Drizzle mutations on `vagas`, calls `revalidatePath('/vagas')`. The `status`
enum (`aberta`, `concluida`, `cancelada`, `pausada`, `incompleta`) is edited as a
plain field — no state-machine guards are applied in the MVP.

Not responsible for: cascading to `Triagem` when a Vaga is soft-deleted, or
fetching the Cargo option list for forms (→ layer-ui RHPages).

### Where does it live?

`src/actions/vagas.ts`

### Building blocks

No sub-artifacts.

### Structural convention

```ts
'use server';
import { vagaRepository } from '~/server/db/repositories/vaga';
import { criarVagaSchema, editarVagaSchema } from '~/lib/validation/vaga';
import { revalidatePath } from 'next/cache';

export async function criarVaga(formData: FormData) {
  const parsed = criarVagaSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  const row = await vagaRepository.create(parsed.data);
  revalidatePath('/vagas');
  return { success: true, data: row };
}

export async function deletarVaga(id: string) {
  await vagaRepository.softDelete(id);
  revalidatePath('/vagas');
  return { success: true };
}
```

### Hard rules

- `cargo_id` must be validated as `z.string().uuid()`.
- `posicoes_disponiveis` must be validated as `z.number().int().positive()`.
- Never hard-delete.

---

## Workflow

1. Ensure `src/lib/validation/vaga.ts` includes all needed fields.
2. Add or update functions in `src/actions/vagas.ts`.
3. Call `revalidatePath('/vagas')` (and `/vagas/[id]` for edit) after mutation.

---

## References

- [CargosActions](cargos-actions.md)
- [TriagensActions](triagens-actions.md)
- [../../layer-validation/references/entity-schema.md](../../layer-validation/references/entity-schema.md)
- [../../layer-db/references/drizzle-schema.md](../../layer-db/references/drizzle-schema.md)

Real implementations:
- `src/actions/vagas.ts`
