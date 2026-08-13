# N8nCandidatosWebhookRoute

The `POST /api/webhooks/n8n/candidatos` Route Handler — receives structured
candidate data extracted by the n8n `Cadastro_Candidato` workflow and persists
it, then triggers the outbound Classificador call.

## Responsibilities

Validates the `x-n8n-secret` and `x-idempotency-key` headers, parses the inbound
**array** payload (each item: `candidato`, `formacoes[]`, `experiencias_profissionais[]`,
`certificacoes[]`, `referencias`) with the candidatos webhook schema, resolves
`referencias.area_interesse` / `referencias.cargo_interesse` (free-text strings)
to `Departamento`/`Cargo` FKs via lookup, upserts `Candidato` by email together
with its children in a single transaction, and — after persisting — triggers the
outbound Classificador webhook (fire-and-forget, per ADR-0005) with the new
candidate plus open Vagas in the same city.

Not responsible for: the screening result itself (→ N8nTriagemWebhookRoute), Candidato
CRUD from UI forms (→ layer-actions CandidatosActions), or file serving (→ FileRoute).

### Where does it live?

`src/app/api/webhooks/n8n/candidatos/route.ts`

### Building blocks

No sub-artifacts.

### Structural convention

```ts
import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { env } from '@/env';
import { db } from '@/server/db';
import { candidatoRepository } from '@/server/db/repositories/candidato';
import { candidatoFormacaoRepository } from '@/server/db/repositories/candidato-formacao';
import { departamentoRepository } from '@/server/db/repositories/departamento';
import { cargoRepository } from '@/server/db/repositories/cargo';
import { vagaRepository } from '@/server/db/repositories/vaga';
import { n8nCandidatosWebhookSchema } from '@/lib/validation/webhook';

export async function POST(req: Request) {
  if (req.headers.get('x-n8n-secret') !== env.WEBHOOK_N8N_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const idempotencyKey = req.headers.get('x-idempotency-key');
  if (!idempotencyKey) {
    return NextResponse.json({ error: 'Missing x-idempotency-key' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = n8nCandidatosWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const criados = [];
  for (const item of parsed.data) {
    // 1. Check existing Candidato by email — if soft-deleted, return 409 (ADR-0002)
    // 2. Lookup area_interesse_id / cargo_interesse_id via referencias.* (ILIKE), NULL if not found
    // 3. Upsert Candidato + formacoes/experiencias/certificacoes inside db.transaction(tx)
    // 4. Collect the created/updated Candidato for the outbound trigger
  }

  after(async () => {
    // Fire-and-forget: for each created Candidato, look up open Vagas in the same
    // city (vagaRepository) and POST { candidato, vagas } to
    // env.CLASSIFICADOR_N8N_WEBHOOK_URL with a short timeout. Log failures, never throw.
  });

  return NextResponse.json({ success: true, count: criados.length });
}
```

### Hard rules

- Always check `x-n8n-secret` and `x-idempotency-key` before any DB operation — return 401/400 immediately on failure.
- A soft-deleted `Candidato` with the same email must not be silently reactivated — return 409 with `candidato_soft_deleted` (ADR-0002).
- `area_interesse_id` / `cargo_interesse_id` lookups that fail must persist `NULL`, not block candidate creation.
- `disponibilidade_horarios`: boolean `false` → persist `NULL`; descriptive string → persist as `TEXT`.
- The outbound Classificador call must run after the response (via `after()` or a non-blocking `fetch`) and must never fail the candidate registration — log only (ADR-0005).
- Payload is always an array; process each item independently so one invalid item doesn't fail the whole batch.

---

## Workflow

Update when the n8n `Cadastro_Candidato` payload contract changes or the
area/cargo lookup policy changes.

1. Update `src/lib/validation/webhook.ts` to match the new payload shape.
2. Update the route handler's upsert + lookup logic.
3. Update the outbound trigger's city-filter query if the matching rule changes (ADR-0005).
4. Test with a cURL request including `x-n8n-secret`, `x-idempotency-key`, and a payload matching `docs/N8N_WEBHOOK_CONTRACT.md` section 1.

---

## References

- [N8nTriagemWebhookRoute](n8n-webhook-route.md)
- [FileRoute](file-route.md)
- [../../layer-validation/references/webhook-schema.md](../../layer-validation/references/webhook-schema.md)
- [../../layer-db/references/repository.md](../../layer-db/references/repository.md)
- `docs/N8N_WEBHOOK_CONTRACT.md` — section 1 (canonical payload/response contract)
- `docs/decisions/0002-webhook-deleted-candidate-conflict.md`
- `docs/decisions/0005-outbound-classifier-trigger.md`

Real implementations:
- `src/app/api/webhooks/n8n/candidatos/route.ts` (not created yet at scaffold time)
