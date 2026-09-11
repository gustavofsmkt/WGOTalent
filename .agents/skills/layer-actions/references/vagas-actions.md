# VagasActions

Server Actions for `Vaga` CRUD: create, update, and soft-delete. `Vaga` has a
required FK to `Cargo` (which chains to `Departamento`).

## Responsibilities

Valida entradas como `cargo_id` e `posicoes_disponiveis` (deve ser maior que
zero), executa mutações por meio dos repositórios e chama
`revalidatePath('/vagas')`. Quando `status` recebe `concluida` ou `cancelada`,
toda `Triagem` ativa da vaga cujo `resultado` ainda seja `em_andamento` é
finalizada como `banco_talentos`, e os candidatos afetados recebem
`em_banco_talentos = true`, tudo na mesma transação. Resultados existentes como
`aprovado`, `reprovado` e `desistente` são preservados. Os status `aberta`,
`pausada` e `incompleta` não disparam essa regra.

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
3. Ao definir `concluida` ou `cancelada`, atualize a vaga, suas triagens em
   andamento e o banco de talentos dos candidatos em uma única transação por
   meio dos métodos dos repositórios.
4. Chame `revalidatePath('/vagas')` (e `/vagas/[id]` na edição) após a mutação;
   invalide também `/triagens`, `/candidatos` e `/dashboard` quando as triagens
   forem finalizadas.

---

## References

- [CargosActions](cargos-actions.md)
- [TriagensActions](triagens-actions.md)
- [../../layer-validation/references/entity-schema.md](../../layer-validation/references/entity-schema.md)
- [../../layer-db/references/drizzle-schema.md](../../layer-db/references/drizzle-schema.md)

Real implementations:
- `src/actions/vagas.ts`
