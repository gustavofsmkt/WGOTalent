---
name: layer-api
description: >-
  Owns all Next.js Route Handlers — the external-facing mutation and file-serving
  boundary. Load when touching app/api/webhooks/n8n/triagem/route.ts or
  app/api/files/[...path]/route.ts. Trigger terms: Route Handler, webhook, n8n,
  POST triagem, AvaliacaoIA, file serving, curriculo download, shared secret,
  WEBHOOK_N8N_SECRET, x-n8n-secret, NextResponse, file route, path traversal.
  Do NOT load for Server Actions (→ layer-actions) or UI pages (→ layer-ui).
---

# API Layer

Owns the two Next.js Route Handlers that form the external interface of the
application: the n8n webhook receiver (the only external write path) and the
resume file serving route (the only way files leave storage). This layer is
parallel to `layer-actions` — both consume `layer-db`, `layer-validation`, and
`layer-storage`, but neither depends on the other.

## Responsibilities

`N8nWebhookRoute`: validates the shared secret header, parses the inbound payload
with `WebhookSchema`, upserts `Candidato` by email, saves the resume file via
`StorageProvider`, creates `Triagem` and `AvaliacaoIA` in a single Drizzle
transaction, calls `revalidatePath`.
`FileRoute`: streams resume files from the local storage root through a gated HTTP
response (open in MVP, auth-gated post-MVP).

Not responsible for: internal form mutations (→ layer-actions), schema definitions
(→ layer-db), Zod schema definitions (→ layer-validation), or rendering
(→ layer-ui).

### Where does it live?

- `src/app/api/webhooks/n8n/triagem/route.ts` — POST endpoint for n8n screening results
- `src/app/api/files/[...path]/route.ts` — GET endpoint for resume file streaming

### Building blocks

- **N8nWebhookRoute** — Receives and processes the n8n screening-result payload, including `AvaliacaoIA` creation. See [Reference](references/n8n-webhook-route.md).
- **FileRoute** — Streams resume files from `StorageProvider` through a gated HTTP response. See [Reference](references/file-route.md).

### Hard rules

- `N8nWebhookRoute` must validate the `x-n8n-secret` header against `env.WEBHOOK_N8N_SECRET` (from `src/env.js`) before processing any payload — return 401 immediately if the check fails.
- `N8nWebhookRoute` must create `Triagem` + `AvaliacaoIA` in a single Drizzle transaction — never write one without the other.
- Next.js is the source of truth: n8n never writes to Postgres directly.
- `FileRoute` must validate that the resolved file path stays within `STORAGE_ROOT` to prevent path traversal — return 403 if not.
- Return `NextResponse.json` with appropriate HTTP status codes: 400 for validation failures, 401 for auth, 403 for path violations, 500 for unhandled errors.

---

## Workflow

Work here when the n8n payload contract changes, when access control is added to
the file route, or when a new external-facing endpoint is required.

1. For webhook changes: update `src/lib/validation/webhook.ts` first, then update the route handler. See [N8nWebhookRoute](references/n8n-webhook-route.md).
2. For file route changes: update `src/lib/storage/storage.ts` first if a new operation is needed, then update the route. See [FileRoute](references/file-route.md).
3. Test the webhook route with a cURL or Postman request that includes the `x-n8n-secret` header and a payload matching `n8nTriagemWebhookSchema`.

---

## References

- [N8nWebhookRoute](references/n8n-webhook-route.md)
- [FileRoute](references/file-route.md)
