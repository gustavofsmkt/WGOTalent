# N8nWebhookRoute

The `POST /api/webhooks/n8n/triagem` Route Handler — the only external write path
into the database. n8n calls this after parsing a resume and receiving an AI
screening result from Claude.

## Responsibilities

Validates the `x-n8n-secret` header, parses the payload with `n8nTriagemWebhookSchema`,
upserts `Candidato` by email (rejects silent reactivation of soft-deleted
candidates — return 409 with `candidato_soft_deleted`), saves the resume file via
`StorageProvider`, creates `Triagem` and `AvaliacaoIA` in a single Drizzle
transaction, calls `revalidatePath('/candidatos')` and `revalidatePath('/triagens')`.

Not responsible for: Candidato CRUD from UI forms (→ layer-actions CandidatosActions),
the AI screening itself (owned by n8n + Claude, external), or file serving
(→ FileRoute).

### Where does it live?

`src/app/api/webhooks/n8n/triagem/route.ts`

### Building blocks

No sub-artifacts.

### Structural convention

```ts
import { NextResponse } from 'next/server';
import { env } from '@/env';
import { db } from '@/server/db';
import { candidatoRepository } from '@/server/db/repositories/candidato';
import { triagemRepository } from '@/server/db/repositories/triagem';
import { avaliacaoIaRepository } from '@/server/db/repositories/avaliacao-ia';
import { n8nTriagemWebhookSchema } from '@/lib/validation/webhook';
import { storage } from '@/lib/storage/local-storage-provider';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  if (req.headers.get('x-n8n-secret') !== env.WEBHOOK_N8N_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = n8nTriagemWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { candidato: candidatoData, curriculo_conteudo, curriculo_filename, avaliacao, vaga_id } = parsed.data;

  await db.transaction(async (tx) => {
    // 1. Upsert Candidato by email — check deletedAt before upserting
    //    Use candidatoRepository.findByEmail(candidatoData.email, tx) then
    //    candidatoRepository.create(candidatoData, tx) or return 409 if soft-deleted
    // 2. Save resume via storage.save(key, buffer, mimeType)
    // 3. Create Triagem: triagemRepository.create({ ... }, tx)
    // 4. Create AvaliacaoIA: avaliacaoIaRepository.create({ ..., vagaFoiInferida: !vaga_id }, tx)
  });

  revalidatePath('/candidatos');
  revalidatePath('/triagens');
  return NextResponse.json({ success: true });
}
```

### Hard rules

- Always check `x-n8n-secret` before any DB or file operation — return 401 immediately on failure.
- `Triagem` + `AvaliacaoIA` must be inserted in a single transaction — never one without the other.
- Set `vaga_foi_inferida = true` on `AvaliacaoIA` when `vaga_id` was absent in the payload.
- A soft-deleted `Candidato` with the same email must not be silently reactivated — return 409 and let the human operator decide.

---

## Workflow

Update when the n8n payload contract changes or the Candidato upsert policy changes.

1. Update `src/lib/validation/webhook.ts` to match the new payload shape.
2. Update the route handler transaction logic.
3. Test with a cURL request including `x-n8n-secret` and a matching payload body.

---

## References

- [FileRoute](file-route.md)
- [../../layer-validation/references/webhook-schema.md](../../layer-validation/references/webhook-schema.md)
- [../../layer-storage/references/storage-provider.md](../../layer-storage/references/storage-provider.md)
- [../../layer-db/references/drizzle-schema.md](../../layer-db/references/drizzle-schema.md)

Real implementations:
- `src/app/api/webhooks/n8n/triagem/route.ts`
