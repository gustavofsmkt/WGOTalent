# HR Platform (Triagem de Candidatos) — Next.js App Router Refactor Spec

## Role & Goal
You are a senior Next.js/full-stack engineer. Build the MVP of an HR platform that manages departments, job positions, job openings, candidates, and AI-assisted resume screening. Use **Next.js App Router** for both frontend and backend (no separate API server). Follow Server Components / Server Actions / Route Handlers conventions.

## Schema reference
The full data model is defined separately and is the source of truth for field names, types, and constraints — do not redefine or guess at fields:
- `db_triagem_proposta.ts` — canonical TypeScript interface spec (field-level, with SQL type comments) *(Nota editorial: corrigido o nome do arquivo de `bd_triagem_proposta.ts` para `db_triagem_proposta.ts` no import/referência)*
- `lib/db/schema.ts` — Drizzle implementation of the same model (generate this from the spec above if it doesn't exist yet)

Entities: `Departamento`, `Cargo`, `Vaga`, `Candidato`, `CandidatoFormacao`, `CandidatoExperienciaProfissional`, `CandidatoCertificacao`, `Triagem`, `AvaliacaoIA`. Relationships: Departamento 1—N Cargo 1—N Vaga. Candidato 1—N Triagem N—1 Vaga. Triagem 1—1 AvaliacaoIA. Candidato 1—N Formacao/Experiencia/Certificacao.

Always check the schema file before writing a query, form, or validation schema — do not assume a field exists or guess its type/enum values.

## Stack decisions (already made)
- **Framework**: Next.js 14+ App Router, TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle
- **Auth**: none for MVP (open access) — structure code so auth can be dropped in later without a rewrite (keep server actions/route handlers as the single mutation boundary)
- **Soft delete**: every table has `deleted_at`. No hard deletes anywhere in the app layer.
- **File storage**: local disk via a `StorageProvider` abstraction (swappable to S3/Blob later). Resume files referenced by `Candidato.curriculo_arquivo_key`, never stored in `public/`.
- **AI screening**: external n8n workflow (owned by a teammate) watches an inbox, parses the resume, calls Claude, then POSTs the result to a Next.js webhook route. Next.js is the source of truth — n8n never writes to Postgres directly.
- **Styling**: your choice, keep consistent (Tailwind assumed unless told otherwise)

## Soft delete pattern — must be used everywhere
```ts
const timestamps = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
};
```
- Every `select` goes through a shared `notDeleted(qb, table)` query-builder helper (see schema file / prior discussion for the exact implementation) — never write a raw `.where(isNull(...))` inline, always go through the helper so it can't be forgotten.
- "Delete" server actions set `deletedAt = now()`, they never issue a real `DELETE`.
- **Cascade is application-level, not FK-level.** Soft-deleting a `Candidato` must also soft-delete its `CandidatoFormacao`, `CandidatoExperienciaProfissional`, `CandidatoCertificacao`, and `Triagem` rows (and, transitively, the linked `AvaliacaoIA`). Implement this as a single transaction in the `deleteCandidato` server action — do not rely on Postgres `ON DELETE CASCADE`, it won't fire on soft delete.
- Unique constraints (`Departamento.nome`, `Candidato.email`) are plain `UNIQUE`, not partial — a soft-deleted row still blocks reuse of that name/email. This is intentional, don't "fix" it.

## Project structure

```
app/
  (rh)/
    departamentos/
      page.tsx                  # Server Component: list + link to create
      [id]/page.tsx              # detail + edit form
    cargos/
      page.tsx
      [id]/page.tsx
    vagas/
      page.tsx
      [id]/page.tsx
    candidatos/
      page.tsx
      [id]/page.tsx              # includes formacoes, experiencias, certificacoes, triagens
    triagens/
      page.tsx                   # pipeline view, filterable by etapa/resultado/motivo
      [id]/page.tsx               # triagem detail + linked avaliacao_ia (1:1, shown inline, not a separate CRUD)
  api/
    webhooks/
      n8n/
        triagem/route.ts         # POST — receives screening result from n8n
    files/
      [...path]/route.ts         # GET — streams resume files from local storage (auth-gated later)

actions/                         # 'use server' — all mutations live here
  departamentos.ts
  cargos.ts
  vagas.ts
  candidatos.ts                  # includes formacao/experiencia/certificacao sub-mutations
  triagens.ts

lib/
  db/
    schema.ts                    # Drizzle schema — see schema reference above
    index.ts                     # Drizzle client singleton
    query-helpers.ts             # notDeleted() and other shared query builders
  storage/
    storage.ts                   # StorageProvider interface
    local-storage-provider.ts    # fs-based implementation for MVP
  validation/
    departamento.ts               # Zod schemas, reused by actions + webhook route
    cargo.ts
    vaga.ts
    candidato.ts
    triagem.ts

components/
  ui/                            # shared table, form, badge, etc.
  departamentos/ (form.tsx, table.tsx)
  cargos/
  vagas/
  candidatos/
  triagens/
```

## Patterns to follow

1. **Reads = Server Components.** Every `page.tsx` under `(rh)/` fetches its own data directly from `lib/db` (Drizzle) inside the Server Component, always through `notDeleted()`. No client-side fetching, no route handlers for internal reads.
2. **Writes = Server Actions.** All create/edit/soft-delete for the 5 top-level entities go through `'use server'` functions in `actions/*.ts`, called from forms via `<form action={...}>` or `useTransition`. Each action:
   - validates input with the matching Zod schema from `lib/validation`
   - performs the Drizzle mutation (insert/update/soft-delete)
   - calls `revalidatePath` for the relevant list/detail routes
   - returns a typed `{ success: true, data } | { success: false, error }` result
3. **External write = Route Handler.** The n8n → Next.js integration is the only mutation path that isn't a Server Action. `app/api/webhooks/n8n/triagem/route.ts`:
   - authenticates via a shared secret header (e.g. `x-webhook-secret`)
   - validates payload with a dedicated webhook Zod schema
   - upserts `Candidato` by email (respecting soft-delete: reactivating a soft-deleted candidate needs an explicit decision, see open questions)
   - saves the resume file through `StorageProvider.save()`, writes `curriculo_arquivo_key`
   - creates the `Triagem` row (`etapa`, `resultado`, `motivo` per schema) and the linked `AvaliacaoIA` row in one transaction
   - is idempotent — see open questions, current schema has no dedup key for inbound emails yet
   - calls `revalidatePath('/candidatos')` and `revalidatePath('/triagens')`
4. **Storage abstraction.** `StorageProvider` exposes `save()`, `getUrl()`, `delete()`. Files live outside `public/`, served through `app/api/files/[...path]/route.ts` so access can be gated later.
5. **Foreign key integrity in the UI.** Cargo form selects an existing Departamento. Vaga form selects an existing Cargo. Triagem form selects an existing Candidato and Vaga. Candidato's `cargo_interesse_id` / `area_interesse_id` are optional selects. Use server-fetched option lists (already filtered through `notDeleted`), not client fetches.
6. **Triagem status is two fields, not one.** UI must drive `etapa` and `resultado` as separate controls (e.g. a stage stepper + an outcome selector), with `motivo` only shown/required when `resultado` is `reprovado` or `desistente`, and constrained to the matching subset of motivo values (reprovado vs. desistente) — see schema comments for the split. Enforce this pairing in the Zod schema, not just the UI.
7. **No premature complexity.** Skip parallel routes, intercepting routes/modals, and auth for this MVP pass — plain nested pages with Suspense boundaries around any slower list (e.g. triagens with joins across candidato/vaga/avaliacao_ia) is enough.

## Acceptance criteria
- [ ] CRUD (add/view/edit/soft-delete) works for Departamento, Cargo, Vaga, Candidato, Triagem, all through Server Components + Server Actions, all reads filtered by `notDeleted`
- [ ] Soft-deleting a Candidato cascades to its Formacao/Experiencia/Certificacao/Triagem rows in one transaction
- [ ] Cargo requires a Departamento; Vaga requires a Cargo; Triagem requires a Candidato and a Vaga — enforced at DB (FK) and form level
- [ ] Triagem's `etapa`/`resultado`/`motivo` are edited as distinct fields with `motivo` validation matching `resultado`
- [ ] At most one `Triagem` with `resultado = 'em_andamento'` per (candidato, vaga) pair — enforced via partial unique index
- [ ] Resume files are stored locally through `StorageProvider`, never in `public/`, and served via the gated route handler
- [ ] `/api/webhooks/n8n/triagem` accepts n8n's payload, creates Candidato/Triagem/AvaliacaoIA, and is protected by a shared secret
- [ ] All list pages reflect new/edited data immediately after mutation (via `revalidatePath`)
