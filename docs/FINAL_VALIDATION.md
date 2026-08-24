# Validação Final — Banco Vazio (TASK-128)

> Execução completa da bateria de validação greenfield contra um banco de dados
> e volume Docker recém-criados (sem dados residuais), confirmando que o setup
> documentado em [README](../README.md) e [PROJECT_STATE.md](PROJECT_STATE.md)
> funciona de ponta a ponta a partir de zero. Nenhuma feature foi adicionada;
> apenas bloqueadores (se houvesse) seriam corrigidos.

**Data**: 2026-08-24
**Ambiente**: Windows 11, Node (npm 11.9.0), Docker Desktop 29.7.2 / Compose v5.3.1

## Resumo

| # | Etapa | Resultado |
|---|---|---|
| 1 | `npm ci` | ✅ PASS |
| 2 | `npm run check` (lint + testes + build) | ✅ PASS |
| 3 | `docker compose config` | ✅ PASS |
| 4 | Banco/volume de teste vazio | ✅ PASS |
| 5 | `npm run db:migrate` | ✅ PASS |
| 6 | `npm run db:smoke` | ✅ PASS |
| 7 | `npm run db:seed` | ✅ PASS |
| 8 | `npm run check:integration` | ✅ PASS |
| 9 | Smoke das páginas (dev server) | ✅ PASS |
| 10 | Smoke storage/intake | ✅ PASS |
| 11 | Repository cleanliness check | ✅ PASS (sem achados) |
| 12 | `git diff --check` | ✅ PASS |
| 13 | Busca de segredos | ✅ PASS |
| 14 | `git status` | ✅ PASS (árvore limpa) |

Nenhum bloqueador encontrado. Nenhuma correção foi necessária.

## Detalhes por etapa

### 1. `npm ci`
```bash
npm ci
```
`added 721 packages, and audited 722 packages in 32s`. 8 vulnerabilidades reportadas pelo `npm audit`
(4 moderate, 4 high) — pré-existentes nas árvores de dependências de terceiros, sem relação com esta
task; nenhum ajuste de dependência foi solicitado no escopo.

### 2. `npm run check`
```bash
npm run check
# = npm run lint && npm run test:run && npm run build
```
- **Lint**: `0 errors`, `212 warnings` (todos `@typescript-eslint/no-unused-vars` — pré-existentes,
  fora do escopo desta task de validação).
- **Testes**: `Test Files 48 passed (48)` / `Tests 390 passed (390)`.
- **Build**: `next build` concluído com sucesso, 27 rotas geradas (estáticas + dinâmicas).

### 3. `docker compose config`
```bash
docker compose config
```
Configuração válida — serviço `postgres` (imagem `postgres:16-alpine`), volume nomeado
`postgres_data`, healthcheck via `pg_isready`, init script `infra/postgres/init/001-unaccent.sql`.

### 4. Banco/volume de teste vazio
Docker Desktop foi iniciado (não estava rodendo) e o stack existente (com dados de dev de sessões
anteriores) foi descartado e recriado do zero para garantir um volume verdadeiramente vazio:
```bash
docker compose down -v
docker compose up -d
# aguardado até o healthcheck reportar "healthy"
```
Resultado: container `wgotalent-postgres` `healthy`, volume `wgotalent_postgres_data` recriado vazio.

> **Nota**: esta etapa é destrutiva por natureza (remove o volume Docker local de desenvolvimento) e
> era exigida explicitamente pelo escopo da task ("banco/volume de teste vazio"). Nenhum dado de
> produção foi afetado — apenas o volume Docker local usado em desenvolvimento.

### 5. `npm run db:migrate`
```bash
npm run db:migrate
```
`[✓] migrations applied successfully!`. Apenas `NOTICE`s do Postgres sobre truncamento de nomes de
constraint de FK acima de 63 caracteres (limite de identificador do Postgres) — comportamento
esperado e não-bloqueante, sem perda de integridade referencial.

### 6. `npm run db:smoke`
```bash
npm run db:smoke
```
`SELECT 1` e `unaccent('João')` (extensão `unaccent`) validados com sucesso.

### 7. `npm run db:seed`
```bash
npm run db:seed
```
Seed completo: departamentos, cargos, vagas, candidatos (dados fictícios), formações, experiências,
certificações, triagens (múltiplos estados de funil) e avaliações de IA (presentes e ausentes).

### 8. `npm run check:integration`
```bash
npm run check:integration
# = npm run db:migrate && npm run db:smoke
```
Migração re-executada de forma idempotente (schema/tabela `__drizzle_migrations` já existentes,
apenas `NOTICE`s de "already exists, skipping") + smoke test novamente verde.

### 9. Smoke das páginas
Servidor de desenvolvimento (`npm run dev`) iniciado e as páginas principais verificadas em
navegador contra o banco recém-semeado, sem erros de console e com dados renderizados corretamente:
- `/dashboard` — KPIs, funil por etapa, desfechos, atividade recente.
- `/departamentos` — 5 departamentos listados.
- `/cargos` — 6 cargos listados.
- `/vagas` — 6 vagas listadas (KPIs de total/abertas/posições corretos).
- `/candidatos` — 6 candidatos listados (origem manual/e-mail/IA).
- `/triagens` — 7 triagens no pipeline, com filtros e ambas as visões (Pipeline/Lista).
- `/candidatos/novo` — formulário completo de cadastro manual renderizado.
- `/candidatos/upload-lote` — formulário de upload em lote renderizado.

Nenhum erro de console (`read_console_messages`) em nenhuma das páginas.

### 10. Smoke storage/intake
- Testes unitários do `StorageProvider` (`local-storage-provider.test.ts`) já cobertos pela etapa 2
  (parte dos 390 testes).
- Rota `GET /api/files/[...path]` validada ponta a ponta contra um arquivo real em
  `storage/resumes/`: `HTTP 200`, `Content-Type: application/pdf`, corpo com os bytes corretos.
- Rota `GET /api/files/[...path]` para chave inexistente: `HTTP 404` (tratamento de erro correto,
  sem vazamento de stack trace).
- Formulário de cadastro manual (`/candidatos/novo`) e de upload em lote (`/candidatos/upload-lote`)
  renderizam corretamente os campos de anexo de currículo.

> Observação: a extração via IA (Gemini) depende de credenciais de provedor cadastradas em
> `/admin/agentes` (cifradas em banco), que não fazem parte do seed padrão nem do escopo desta
> validação de infraestrutura — não foi exercitado o fluxo completo de extração por IA.

### 11. Repository cleanliness check
- `TODO`/`FIXME` remanescentes no código: apenas 2, ambos prospectivos (não são "dívida resolvida"):
  `src/app/api/files/[...path]/route.ts:50` (autenticação futura) e
  `src/app/admin/layout.tsx:1` (RBAC futuro).
- `npx depcheck` reportou dependências "não usadas" (`shadcn`, `tw-animate-css`,
  `@tailwindcss/postcss`, `postcss`, `tailwindcss`, `@types/react-dom`, `eslint-config-next`) — todas
  são **falsos positivos**: usadas via CSS (`globals.css`), `postcss.config.js`,
  `eslint.config.mjs` ou como CLI/types, não via `import` estático que o depcheck reconhece.
  Confirmado manualmente arquivo a arquivo. Nenhuma dependência órfã real encontrada.
- Nenhum hard delete (`db.delete(`) fora do script de seed (`src/server/db/seed.ts`, uso legítimo de
  ferramenta de dev), confirmando a invariante de soft delete em todo o código de aplicação.

### 12. `git diff --check`
```bash
git diff --check
```
Sem saída — nenhum erro de espaço em branco / conflito de merge residual.

### 13. Busca de segredos
- Confirmado que `.env` está no `.gitignore` (`.env*`) e **não** está rastreado pelo Git — apenas
  `.env.example` (sem valores reais) está versionado.
- Varredura por padrões de segredo (`api[_-]key`, `password=`, chaves AWS `AKIA...`, blocos
  `PRIVATE KEY`, tokens `sk-`/`ghp_`) em todos os arquivos rastreados: nenhum segredo real
  encontrado — todas as ocorrências são nomes de campo/schema relacionados ao armazenamento
  **cifrado** de credenciais de LLM (`apiKeyCifrada`), não valores em texto puro.

### 14. `git status`
```bash
git status --porcelain
```
Árvore de trabalho limpa antes desta alteração (nenhum arquivo pendente além deste documento e do
commit de fechamento da task).

## Ações realizadas neste ciclo

- Docker Desktop foi iniciado (estava parado).
- O volume de dados Postgres local foi recriado do zero (`docker compose down -v && up -d`) para
  garantir uma validação genuinamente "banco vazio" ponta a ponta.
- Nenhum código de aplicação foi alterado — nenhum bloqueador foi encontrado que exigisse correção.
