# CandidatosActions

Server Actions for `Candidato` and all its owned sub-entities: `CandidatoFormacao`,
`CandidatoExperienciaProfissional`, `CandidatoCertificacao`. Also owns
`deletarCandidato`, the cascade soft-delete that must touch all sub-entities and
their linked `Triagem` + `AvaliacaoIA` rows in a single transaction.

## Responsibilities

Validates and mutates `candidatos`, `candidato_formacoes`, `candidato_experiencias`,
`candidato_certificacoes`. Calls `storage.save()` / `storage.delete()` when
`curriculo_arquivo_key` changes. The `deletarCandidato` action runs a `db.transaction()`
that soft-deletes the Candidato and all owned rows in order.

Not responsible for: `Triagem` mutations (→ TriagensActions), serving the resume
file (→ layer-api FileRoute), or rendering the candidato form (→ layer-ui).

### Where does it live?

`src/actions/candidatos.ts`

### Building blocks

No sub-artifacts.

### Structural convention

Cascade soft-delete (the most complex action in the codebase):
```ts
'use server';
import { db } from '@/server/db';
import { candidatoRepository } from '@/server/db/repositories/candidato';
import { candidatoFormacaoRepository } from '@/server/db/repositories/candidato-formacao';
import { candidatoExperienciaRepository } from '@/server/db/repositories/candidato-experiencia';
import { candidatoCertificacaoRepository } from '@/server/db/repositories/candidato-certificacao';
import { triagemRepository } from '@/server/db/repositories/triagem';
import { avaliacaoIaRepository } from '@/server/db/repositories/avaliacao-ia';
import { criarCandidatoSchema, editarCandidatoSchema } from '@/lib/validation/candidato';
import { storage } from '@/lib/storage/local-storage-provider';
import { revalidatePath } from 'next/cache';

export async function criarCandidato(formData: FormData) {
  const parsed = criarCandidatoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { success: false, error: parsed.error.flatten() };

  try {
    const row = await candidatoRepository.create(parsed.data);
    revalidatePath('/candidatos');
    return { success: true, data: row };
  } catch (e: any) {
    if (e.code === '23505') return { success: false, error: 'email_em_uso' };
    throw e;
  }
}

export async function deletarCandidato(id: string) {
  await db.transaction(async (tx) => {
    // 1. Sub-entities
    await candidatoFormacaoRepository.softDeleteByCandidatoId(id, tx);
    await candidatoExperienciaRepository.softDeleteByCandidatoId(id, tx);
    await candidatoCertificacaoRepository.softDeleteByCandidatoId(id, tx);
    // 2. Triagem → AvaliacaoIA
    const triagemIds = await triagemRepository.findIdsByCandidatoId(id, tx);
    if (triagemIds.length) {
      await avaliacaoIaRepository.softDeleteByTriagemIds(triagemIds, tx);
      await triagemRepository.softDeleteByCandidatoId(id, tx);
    }
    // 3. Candidato itself — storage delete happens here (storage is not a db concern)
    const row = await candidatoRepository.softDelete(id, tx);
    if (row?.curriculoArquivoKey) await storage.delete(row.curriculoArquivoKey);
  });
  revalidatePath('/candidatos');
  return { success: true };
}
```

### Hard rules

- `deletarCandidato` must run inside a single `db.transaction()` — partial cascades are not acceptable.
- Cascade order inside the transaction: sub-entities first, then Triagem → AvaliacaoIA, then Candidato (innermost children before parent).
- Catch Postgres error `23505` on `email` and return `{ success: false, error: 'email_em_uso' }` — a soft-deleted Candidato still holds the unique email slot.
- Delete the resume file from storage when soft-deleting a Candidato with a `curriculoArquivoKey`.
- Never hard-delete.

---

## Workflow

1. Ensure `src/lib/validation/candidato.ts` is up to date.
2. Add or update functions in `src/actions/candidatos.ts`.
3. For `deletarCandidato`, verify the cascade chain covers all five sub-entity tables.

---

## References

- [TriagensActions](triagens-actions.md)
- [../../layer-storage/references/storage-provider.md](../../layer-storage/references/storage-provider.md)
- [../../layer-validation/references/entity-schema.md](../../layer-validation/references/entity-schema.md)
- [../../layer-db/references/drizzle-schema.md](../../layer-db/references/drizzle-schema.md)

Real implementations:
- `src/actions/candidatos.ts`
