# EntitySchema

Per-entity Zod schemas that validate user-submitted form data at the mutation
boundary. Base schemas are derived from Drizzle table definitions via `drizzle-zod`
(`createInsertSchema`) so column types and enum values are never declared twice.
Business rules that cannot be expressed as column constraints (e.g. the triagem
motivo coupling) are added via `.superRefine()`.

## Responsibilities

Validates form payloads before they reach Drizzle. Enforces field constraints
(string lengths, enum values, UUID formats, required vs. optional) as defined in
`docs/db_triagem_proposta.ts`. The `triagem` schema is special: it enforces the
`etapa`/`resultado`/`motivo` coupling rule that the UI also reflects.

Not responsible for: running the Drizzle insert/update (→ layer-actions)
or rendering form fields (→ layer-ui DomainComponents).

### Where does it live?

- `src/lib/validation/departamento.ts`
- `src/lib/validation/cargo.ts`
- `src/lib/validation/vaga.ts`
- `src/lib/validation/candidato.ts`
- `src/lib/validation/triagem.ts`

### Building blocks

No sub-artifacts.

### Structural convention

Standard entity — derive from Drizzle table, pick user fields:
```ts
import { createInsertSchema } from 'drizzle-orm/zod';
import { z } from 'zod';
import { departamentos } from '~/server/db/schema';

const base = createInsertSchema(departamentos);

// Pick only the fields the user may submit (exclude id, timestamps)
export const criarDepartamentoSchema = base.pick({ nome: true, descricao: true });
export type CriarDepartamentoInput = z.infer<typeof criarDepartamentoSchema>;

export const editarDepartamentoSchema = criarDepartamentoSchema.partial();
export type EditarDepartamentoInput = z.infer<typeof editarDepartamentoSchema>;
```

Triagem — derive base, then add the motivo coupling rule via `.superRefine()`:
```ts
import { createInsertSchema } from 'drizzle-orm/zod';
import { z } from 'zod';
import { triagens } from '~/server/db/schema';

const MOTIVO_REPROVADO = ['curriculo', 'fit_cultural', 'testes', 'rh', 'gestor'] as const;
const MOTIVO_DESISTENTE = ['incompatibilidade_salarial', 'aceitou_outra_proposta',
  'nao_atendeu_contato', 'motivos_pessoais'] as const;

const base = createInsertSchema(triagens);

export const criarTriagemSchema = base
  .pick({ vaga_id: true, candidato_id: true, etapa: true, resultado: true, motivo: true, parecer_rh: true })
  .superRefine((val, ctx) => {
    if (val.resultado === 'reprovado' && !(MOTIVO_REPROVADO as readonly string[]).includes(val.motivo ?? '')) {
      ctx.addIssue({ code: 'custom', message: 'motivo inválido para reprovado', path: ['motivo'] });
    }
    if (val.resultado === 'desistente' && !(MOTIVO_DESISTENTE as readonly string[]).includes(val.motivo ?? '')) {
      ctx.addIssue({ code: 'custom', message: 'motivo inválido para desistente', path: ['motivo'] });
    }
    if (!['reprovado', 'desistente'].includes(val.resultado ?? '') && val.motivo !== null) {
      ctx.addIssue({ code: 'custom', message: 'motivo deve ser null', path: ['motivo'] });
    }
  });
export type CriarTriagemInput = z.infer<typeof criarTriagemSchema>;
```

### Client schema (`*.client.ts`) {#client-schema}

Client schemas extend server schemas with Portuguese error messages for TanStack Form. They live in a sibling `*.client.ts` file and are **never** imported by server code.

Standard entity — use `.extend()` to override error messages field by field:
```ts
// src/lib/validation/departamento.client.ts
import { criarDepartamentoSchema } from './departamento';

export const criarDepartamentoClientSchema = criarDepartamentoSchema.extend({
  nome: criarDepartamentoSchema.shape.nome
    .min(1, { error: 'Nome é obrigatório' })
    .max(100, { error: 'Nome muito longo' }),
  descricao: criarDepartamentoSchema.shape.descricao
    .max(500, { error: 'Descrição muito longa' })
    .optional(),
});
export type CriarDepartamentoClientInput = z.infer<typeof criarDepartamentoClientSchema>;
```

Triagem — special case because `criarTriagemSchema` is a `ZodEffects` (after `.superRefine()`), which cannot be extended directly. Export the base `ZodObject` and the coupling rule function separately, then re-apply in the client schema:
```ts
// src/lib/validation/triagem.ts — add these named exports:
export const triagemPickedBase = base.pick({ vaga_id: true, candidato_id: true, etapa: true, resultado: true, motivo: true, parecer_rh: true });
export const triagemMotivoCouplingRule = (val: z.infer<typeof triagemPickedBase>, ctx: z.RefinementCtx) => {
  if (val.resultado === 'reprovado' && !(MOTIVO_REPROVADO as readonly string[]).includes(val.motivo ?? '')) {
    ctx.addIssue({ code: 'custom', message: 'motivo inválido para reprovado', path: ['motivo'] });
  }
  if (val.resultado === 'desistente' && !(MOTIVO_DESISTENTE as readonly string[]).includes(val.motivo ?? '')) {
    ctx.addIssue({ code: 'custom', message: 'motivo inválido para desistente', path: ['motivo'] });
  }
  if (!['reprovado', 'desistente'].includes(val.resultado ?? '') && val.motivo !== null) {
    ctx.addIssue({ code: 'custom', message: 'motivo deve ser null', path: ['motivo'] });
  }
};
// criarTriagemSchema = triagemPickedBase.superRefine(triagemMotivoCouplingRule)

// src/lib/validation/triagem.client.ts
import { z } from 'zod';
import { triagemPickedBase, triagemMotivoCouplingRule } from './triagem';

export const criarTriagemClientSchema = triagemPickedBase
  .extend({
    parecer_rh: triagemPickedBase.shape.parecer_rh
      .max(2000, { error: 'Parecer muito longo' })
      .optional(),
  })
  .superRefine(triagemMotivoCouplingRule);
export type CriarTriagemClientInput = z.infer<typeof criarTriagemClientSchema>;
```

Use the client schema in TanStack Form:
```tsx
import { criarDepartamentoClientSchema } from '~/lib/validation/departamento.client'

const form = useForm({
  defaultValues: { nome: '', descricao: '' },
  validators: { onChange: criarDepartamentoClientSchema },
  onSubmit: async ({ value }) => {
    const result = await criarDepartamento(formDataFromValue(value))
    if (!result.success) { /* show server error */ }
  },
})
```

### Hard rules

- Always start from `createInsertSchema(table)` — never redeclare column types or enum values by hand.
- Always `.pick()` user-submittable fields before exporting — never expose `id`, `createdAt`, `updatedAt`, `deletedAt`.
- The `triagem` schema must enforce the `motivo` coupling rule via `.superRefine()` — do not leave it to the UI only.
- Always export both the schema and its inferred TypeScript type.
- UUID FK fields (`cargo_id`, `vaga_id`, `candidato_id`, `departamento_id`) are typed as `z.string().uuid()` automatically by `drizzle-zod` — verify they are not relaxed.
- Client schemas are `*.client.ts` only — never import them from Server Actions or Route Handlers.

---

## Workflow

Add or update a schema when adding a new entity or changing a form field.

1. Import the Drizzle table from `~/server/db/schema`.
2. Call `createInsertSchema(table)` from `drizzle-zod` to get the base schema.
3. `.pick()` only user-submittable fields (exclude `id`, timestamps).
4. Add business constraints with `.extend()` or `.superRefine()` as needed.
5. Export the named schema and its TypeScript type.
6. Import in the relevant `src/actions/<entity>.ts` and parse with `schema.safeParse(Object.fromEntries(formData))`.

---

## References

- [../../layer-actions/references/candidatos-actions.md](../../layer-actions/references/candidatos-actions.md)

Related skills:
- [zod-validation-utilities](../../zod-validation-utilities/SKILL.md)

Real implementations:
- `src/lib/validation/departamento.ts`
- `src/lib/validation/cargo.ts`
- `src/lib/validation/vaga.ts`
- `src/lib/validation/candidato.ts`
- `src/lib/validation/triagem.ts`
