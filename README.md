# WGOTalent

Estado: bootstrap

## Scripts npm

Quality gates reprodutíveis, sem duplicação — cada script cobre uma responsabilidade:

| Script | O que faz |
|---|---|
| `npm run lint` | ESLint (`next/core-web-vitals` + `next/typescript`) sobre todo o projeto. |
| `npm run build` | Build de produção do Next.js. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Vitest em modo watch. |
| `npm run test:run` | Vitest single-run (usado por `check`). Não depende de Postgres real. |
| `npm run db:generate` | Gera migrations do Drizzle a partir do schema. |
| `npm run db:migrate` | Aplica migrations pendentes no Postgres apontado por `DATABASE_URL`. |
| `npm run db:seed` | Popular o banco com dados de exemplo. |
| `npm run db:smoke` | Smoke test de conectividade (`SELECT 1`, extensão `unaccent`). |
| `npm run check` | Gate local: `lint && test:run && build`. Não precisa de Postgres rodando. |
| `npm run check:integration` | Gate de banco: `db:migrate && db:smoke`. Precisa de um Postgres real em `DATABASE_URL` (ver `docker-compose.yml`). |

`check` é o gate padrão antes de commit/PR. `check:integration` roda à parte porque depende de infraestrutura externa (Postgres) que `check` não requer.
