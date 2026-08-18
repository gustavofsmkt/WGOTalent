# TriagensActions

Server Actions for `Triagem` CRUD: create, update `etapa`/`resultado`/`motivo`,
and soft-delete. `Triagem` is the central pipeline entity linking a `Candidato`
to a `Vaga`.

## Responsibilities

Validates `etapa`/`resultado`/`motivo` using the Zod coupling rule from
`src/lib/validation/triagem.ts`, runs Drizzle mutations on `triagens`, revalidates
`/triagens` and the specific triagem detail route. Does not create `AvaliacaoIA`
rows — that is the exclusive responsibility of the native AI engine.

Not responsible for: `AvaliacaoIA` mutations (→ native AI engine),
Candidato cascade on soft-delete (→ CandidatosActions), or rendering the pipeline
view (→ layer-ui).

### Where does it live?

`src/actions/triagens.ts`

### Building blocks

No sub-artifacts.

### Structural convention

```ts
'use server';
import { triagemRepository } from '@/server/db/repositories/triagem';
import { criarTriagemSchema, editarTriagemSchema } from '@/lib/validation/triagem';
import { revalidatePath } from 'next/cache';

export async function criarTriagem(formData: FormData) {
  const parsed = criarTriagemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  try {
    const row = await triagemRepository.create(parsed.data);
    revalidatePath('/triagens');
    return { success: true, data: row };
  } catch (e: any) {
    if (e.code === '23505') return { success: false, error: 'triagem_duplicada' };
    throw e;
  }
}

export async function atualizarTriagem(id: string, formData: FormData) {
  const parsed = editarTriagemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  try {
    const row = await triagemRepository.update(id, parsed.data);
    revalidatePath('/triagens');
    revalidatePath(`/triagens/${id}`);
    return { success: true, data: row };
  } catch (e: any) {
    if (e.code === '23505') return { success: false, error: 'triagem_duplicada' };
    throw e;
  }
}

export async function deletarTriagem(id: string) {
  await triagemRepository.softDelete(id);
  revalidatePath('/triagens');
  return { success: true };
}
```

### Hard rules

- The `motivo` pairing rule is enforced by the Zod schema — do not duplicate the coupling check inline.
- Catch the partial unique index violation on `(candidato_id, vaga_id)` for `resultado = 'em_andamento'` and return `{ success: false, error: 'triagem_duplicada' }`.
- `AvaliacaoIA` is never created or modified by actions in this file — only by the native AI engine.
- Never hard-delete.

---

## Workflow

1. Ensure `src/lib/validation/triagem.ts` is up to date with any new enum values.
2. Add or update functions in `src/actions/triagens.ts`.
3. Call `revalidatePath` for both `/triagens` and `/triagens/[id]` after every mutation.

---

## References

- [CandidatosActions](candidatos-actions.md)
- [../../layer-validation/references/entity-schema.md](../../layer-validation/references/entity-schema.md)
- [../../layer-db/references/drizzle-schema.md](../../layer-db/references/drizzle-schema.md)

Real implementations:
- `src/actions/triagens.ts`
