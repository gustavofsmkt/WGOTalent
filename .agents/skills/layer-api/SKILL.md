---
name: layer-api
description: >-
  Owns all Next.js Route Handlers — the external-facing mutation and file-serving
  boundary. Load when touching app/api/webhooks/n8n/candidatos/route.ts,
  app/api/webhooks/n8n/triagem/route.ts, or app/api/files/[...path]/route.ts, or
  when wiring the outbound Classificador trigger. Trigger terms: Route Handler,
  webhook, n8n, POST candidatos, POST triagem, Classificador,
  CLASSIFICADOR_N8N_WEBHOOK_URL, AvaliacaoIA, file serving, curriculo download,
  shared secret, WEBHOOK_N8N_SECRET, x-n8n-secret, x-idempotency-key,
  NextResponse, file route, path traversal. Do NOT load for Server Actions
  (→ layer-actions) or UI pages (→ layer-ui).
---

# API Layer

Owns the three Next.js Route Handlers that form the external interface of the
application: the n8n candidatos webhook receiver, the n8n triagem webhook
receiver (together, the only external write paths), and the resume file serving
route (the only way files leave storage). This layer is parallel to
`layer-actions` — both consume `layer-db`, `layer-validation`, and
`layer-storage`, but neither depends on the other. Per ADR-0005, the outbound
call to the n8n Classificador is fire-and-forget and is invoked from both this
layer (after `N8nCandidatosWebhookRoute` persists a candidate) and from
`layer-actions` (after a Vaga is created) — it is a cross-cutting concern, not
owned exclusively by either layer.

## Responsibilities

`N8nCandidatosWebhookRoute`: validates the shared secret and idempotency headers,
parses the inbound array payload with the candidatos webhook schema, resolves
`area_interesse`/`cargo_interesse` string references to FKs, upserts `Candidato`
+ children (Formacao/Experiencia/Certificacao), then triggers the outbound
Classificador call (fire-and-forget, per ADR-0005) for open Vagas in the same
city.
`N8nTriagemWebhookRoute`: validates the shared secret and idempotency headers,
parses the inbound array payload (wrapped in `output`) with `WebhookSchema`,
creates `Triagem` and `AvaliacaoIA` in a single Drizzle transaction with the
`etapa`/`resultado` defaults defined in ADR-0004, calls `revalidatePath`.
`FileRoute`: streams resume files from the local storage root through a gated HTTP
response (open in MVP, auth-gated post-MVP).

Not responsible for: internal form mutations (→ layer-actions), schema definitions
(→ layer-db), Zod schema definitions (→ layer-validation), or rendering
(→ layer-ui).

### Where does it live?

- `src/app/api/webhooks/n8n/candidatos/route.ts` — POST endpoint for n8n candidate registration (Cadastro_Candidato)
- `src/app/api/webhooks/n8n/triagem/route.ts` — POST endpoint for n8n screening results (Classificador/Triagem)
- `src/app/api/files/[...path]/route.ts` — GET endpoint for resume file streaming

### Building blocks

- **N8nCandidatosWebhookRoute** — Receives and persists the n8n candidate-registration payload, then triggers the outbound Classificador call. See [Reference](references/n8n-candidatos-webhook-route.md).
- **N8nTriagemWebhookRoute** — Receives and processes the n8n screening-result payload, including `AvaliacaoIA` creation. See [Reference](references/n8n-webhook-route.md).
- **FileRoute** — Streams resume files from `StorageProvider` through a gated HTTP response. See [Reference](references/file-route.md).

### Hard rules

- Both webhook routes must validate `x-n8n-secret` against `env.WEBHOOK_N8N_SECRET` and `x-idempotency-key` before processing any payload — return 401/409 immediately if either check fails.
- `N8nCandidatosWebhookRoute` must not silently reactivate a soft-deleted `Candidato` with the same email — return 409 per ADR-0002.
- `N8nTriagemWebhookRoute` must create `Triagem` + `AvaliacaoIA` in a single Drizzle transaction — never write one without the other.
- Next.js is the source of truth: n8n never writes to Postgres directly.
- The outbound Classificador call is fire-and-forget with a short timeout; its failure must never roll back the Candidato/Vaga transaction that triggered it — log and continue (ADR-0005).
- `FileRoute` must validate that the resolved file path stays within `STORAGE_ROOT` to prevent path traversal — return 403 if not.
- Return `NextResponse.json` with appropriate HTTP status codes: 400 for validation failures, 401 for auth, 403 for path violations, 409 for idempotency/soft-delete conflicts, 500 for unhandled errors.

---

## Workflow

Work here when an n8n payload contract changes, when access control is added to
the file route, or when a new external-facing endpoint is required.

1. For candidatos webhook changes: update `src/lib/validation/webhook.ts` first, then the route handler. See [N8nCandidatosWebhookRoute](references/n8n-candidatos-webhook-route.md).
2. For triagem webhook changes: same schema file, then the route handler. See [N8nTriagemWebhookRoute](references/n8n-webhook-route.md).
3. For file route changes: update `src/lib/storage/storage.ts` first if a new operation is needed, then update the route. See [FileRoute](references/file-route.md).
4. Test each webhook route with a cURL or Postman request that includes `x-n8n-secret`, `x-idempotency-key`, and a payload matching the corresponding schema — see `docs/N8N_WEBHOOK_CONTRACT.md` for canonical examples.

---

## References

- [N8nCandidatosWebhookRoute](references/n8n-candidatos-webhook-route.md)
- [N8nTriagemWebhookRoute](references/n8n-webhook-route.md)
- [FileRoute](references/file-route.md)
- `docs/N8N_WEBHOOK_CONTRACT.md` — canonical payload/response contract for both webhooks
- `docs/decisions/0004-n8n-webhook-field-mapping.md`, `docs/decisions/0005-outbound-classifier-trigger.md`
