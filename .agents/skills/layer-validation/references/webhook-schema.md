# WebhookSchema

The Zod schema for the inbound `POST /api/webhooks/n8n/triagem` payload sent by
the external n8n screening workflow. This schema is the contract between n8n and
the Next.js webhook route handler.

## Responsibilities

Validates the n8n payload — candidate personal data, extracted resume text, and
the AI screening result fields (`score_ia`, `pontos_fortes`, etc.) — before the
Route Handler writes anything to the database. Ensures required fields are present
and that `score_ia` meets the `0 ≤ x ≤ 100` DB constraint.

Not responsible for: the HTTP route handler itself (→ layer-api N8nWebhookRoute),
or the Drizzle inserts that follow validation (→ layer-api N8nWebhookRoute).

### Where does it live?

`src/lib/validation/webhook.ts`

### Building blocks

No sub-artifacts. Related: [EntitySchema](entity-schema.md).

### Structural convention

```ts
import { z } from 'zod';

export const n8nTriagemWebhookSchema = z.object({
  candidato: z.object({
    nome: z.string().min(1).max(150),
    email: z.string().email().max(254),
    celular: z.string().max(20),
    origem: z.enum(['email', 'manual', 'indicacao']),
    // remaining Candidato fields — optional where nullable in schema
  }),
  curriculo_conteudo: z.string(),
  curriculo_filename: z.string(),
  avaliacao: z.object({
    pontos_fortes: z.string(),
    requisitos_faltantes: z.string(),
    eliminatorios_falhos: z.string(),
    alertas: z.string(),
    score_ia: z.number().min(0).max(100),
    parecer_ia: z.string(),
    vaga_foi_inferida: z.boolean(),
  }),
  vaga_id: z.string().uuid().optional(),
});
export type N8nTriagemWebhookPayload = z.infer<typeof n8nTriagemWebhookSchema>;
```

### Hard rules

- Must validate `score_ia` as `0 ≤ x ≤ 100` (matches the DB `CHECK` constraint on `avaliacao_ia`).
- Never relax or skip validation for the n8n caller — it is trusted but not infallible.
- Export the inferred TypeScript type alongside the schema.
- `vaga_id` is optional: absent when n8n inferred the vaga, in which case `vaga_foi_inferida` will be `true`.

---

## Workflow

Update when the n8n workflow changes its output shape.

1. Coordinate with the n8n workflow owner to agree on the new payload contract.
2. Update `src/lib/validation/webhook.ts`.
3. Verify `src/app/api/webhooks/n8n/triagem/route.ts` still parses cleanly against the new schema.

---

## References

- [EntitySchema](entity-schema.md)
- [../../layer-api/references/n8n-webhook-route.md](../../layer-api/references/n8n-webhook-route.md)

Related skills:
- [zod-validation-utilities](../../zod-validation-utilities/SKILL.md)

Real implementations:
- `src/lib/validation/webhook.ts`
