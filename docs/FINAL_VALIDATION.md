# Validação Final — Banco Vazio (TASK-128)

> Execução completa da bateria de validação greenfield contra um banco de dados
> e volume Docker recém-criados (sem dados residuais), confirmando que o setup
> documentado em [README](../README.md) e [PROJECT_STATE.md](PROJECT_STATE.md)
> funciona de ponta a ponta a partir de zero. Nenhuma feature foi adicionada;
> apenas bloqueadores (se houvesse) seriam corrigidos.

**Data**: 2026-08-25 (re-execução — ver [Nota de re-execução](#nota-de-re-execução-2026-08-25))
**Ambiente**: Windows 11, Node (npm 11.9.0), Docker Desktop 29.7.2 / Compose v5.3.1

## Nota de re-execução (2026-08-25)

A validação original (2026-08-24, ver histórico do Git para o texto completo
daquela rodada) cobriu as migrations `0000`–`0016`. Três mudanças de produto
entraram depois do congelamento original sem essa mesma validação de ponta a
ponta: captação por e-mail
([ADR-0010](decisions/0010-captacao-curriculo-via-email.md), migrations
`0017`/`0018`), segundo provedor de LLM — OpenAI
([ADR-0011](decisions/0011-multiplos-provedores-llm.md), sem migration) e
banco de talentos automático
([ADR-0013](decisions/0013-banco-de-talentos-automatico.md), migration
`0019`). Esta rodada repete as 14 etapas do zero cobrindo `0000`–`0019`.

## Resumo

| # | Etapa | Resultado |
|---|---|---|
| 1 | `npm ci` | ✅ PASS |
| 2 | `npm run check` (lint + testes + build) | ✅ PASS |
| 3 | `docker compose config` | ✅ PASS |
| 4 | Banco/volume de teste vazio | ✅ PASS |
| 5 | `npm run db:migrate` (0000–0019) | ✅ PASS |
| 6 | `npm run db:smoke` | ✅ PASS |
| 7 | `npm run db:seed` | ✅ PASS |
| 8 | `npm run check:integration` | ✅ PASS |
| 9 | Smoke das páginas (dev server) | ✅ PASS |
| 10 | Smoke storage/intake | ✅ PASS |
| 11 | Repository cleanliness check | ✅ PASS (sem achados novos) |
| 12 | `git diff --check` | ✅ PASS |
| 13 | Busca de segredos | ✅ PASS |
| 14 | `git status` | ✅ PASS (árvore limpa) |

Nenhum bloqueador encontrado. Nenhuma correção de código foi necessária.

## Detalhes por etapa

### 1. `npm ci`
```bash
npm ci
```
Sucesso. 8 vulnerabilidades reportadas pelo `npm audit` (4 moderate, 4 high) — mesmas
pré-existentes de sempre, em árvores de dependências de terceiros, sem relação com este
ciclo; nenhum ajuste de dependência foi solicitado no escopo.

### 2. `npm run check`
```bash
npm run check
# = npm run lint && npm run test:run && npm run build
```
- **Lint**: `0 errors`, só os warnings pré-existentes de `@typescript-eslint/no-unused-vars`.
- **Testes**: `Test Files 56 passed (56)` / `Tests 456 passed (456)` — 8 arquivos / 66 testes a
  mais que a validação original (2026-08-24: 48/390), cobrindo captação por e-mail, cliente
  OpenAI e dispatcher de provedor, e banco de talentos.
- **Build**: `next build` concluído com sucesso, incluindo as rotas `/admin` (agora com 4 abas:
  Agentes, Credenciais, Captação de E-mail, Configurações) e `/admin/agentes/[slot]`.

### 3. `docker compose config`
```bash
docker compose config
```
Configuração válida — serviço `postgres` (imagem `postgres:16-alpine`), volume nomeado
`postgres_data`, healthcheck via `pg_isready`, init script `infra/postgres/init/001-unaccent.sql`.
Sem mudança desde a validação original (as 3 novas features não tocam infraestrutura Docker).

### 4. Banco/volume de teste vazio
```bash
docker compose down -v
docker compose up -d
```
Docker Desktop foi iniciado (não estava rodando) e o volume existente (com dados de dev de
sessões anteriores, incluindo as tabelas novas) foi descartado e recriado do zero.
Resultado: container `wgotalent-postgres` `healthy` em ~15s, volume `wgotalent_postgres_data`
recriado vazio.

> **Nota**: esta etapa é destrutiva por natureza (remove o volume Docker local de
> desenvolvimento) — confirmado explicitamente com o usuário antes de executar, dado que
> apaga dados de desenvolvimento local (não produção).

### 5. `npm run db:migrate`
```bash
npm run db:migrate
```
`[✓] migrations applied successfully!` — as 20 migrations (`0000`–`0019`) aplicadas em sequência
contra o banco vazio, incluindo as 3 novas desde o congelamento original:
`0017_email_captacao_credenciais`, `0018_email_capturar_desde`,
`0019_candidatos_banco_talentos`. Apenas `NOTICE`s esperados do Postgres sobre truncamento de
nomes de constraint de FK acima de 63 caracteres — mesmo comportamento não-bloqueante já
documentado na validação original, sem perda de integridade referencial.

### 6. `npm run db:smoke`
```bash
npm run db:smoke
```
`SELECT 1` e `unaccent('João')` validados com sucesso.

### 7. `npm run db:seed`
```bash
npm run db:seed
```
Seed completo: departamentos, cargos, vagas, candidatos (dados fictícios, incluindo origens
`manual`/`email`/`indicacao`), formações, experiências, certificações, triagens (múltiplos
estados de funil, incluindo `resultado = banco_talentos`) e avaliações de IA.

### 8. `npm run check:integration`
```bash
npm run check:integration
# = npm run db:migrate && npm run db:smoke
```
Migração re-executada de forma idempotente (`already exists, skipping`) + smoke test
novamente verde.

### 9. Smoke das páginas
Servidor de desenvolvimento (`npm run dev`) iniciado contra o banco recém-semeado e verificado
em navegador, sem erros de console/servidor:
- `/dashboard` — KPIs, funil por etapa (incluindo "Banco de Talentos" no desfecho de triagens),
  atividade recente. `instrumentation.ts` compilou e o loop de captura por e-mail iniciou sem
  erro (confirmado no log do servidor: "Compiled instrumentation Node.js").
- `/candidatos` — listagem com contagem por origem (manual/e-mail/indicação); filtro
  `?pool=banco_talentos` testado explicitamente — retorna corretamente "0 de 6 candidatos" (nenhum
  candidato semeado está no banco de talentos automático) com o empty state correto, sem erro.
- `/admin` — aba "Agentes" lista os 3 slots seedados (todos Gemini por padrão); aba "Captação de
  E-mail" renderiza o formulário completo sem credencial cadastrada (empty state correto).
- `/admin/agentes/classificador_aderencia` — trocado o provedor de "Gemini (Google AI Studio)"
  para "OpenAI" na UI: o campo Modelo resetou automaticamente para o primeiro modelo do catálogo
  OpenAI ("GPT-5.6 Sol"), confirmando em runtime real o comportamento já verificado por leitura de
  código na Fase 16. Sem erro de console. Alteração não salva (não persistida no banco).
- `/candidatos/novo`, `/candidatos/upload-lote` — formulários renderizados sem erro.

### 10. Smoke storage/intake
- `GET /api/files/[...path]` para chave inexistente: `404 Not Found` (confirmado via
  `read_network_requests`), sem vazamento de stack trace.
- Formulários de cadastro manual e upload em lote renderizam os campos de anexo corretamente.

> Observação, igual à validação original: a extração via IA (Gemini/OpenAI) depende de
> credenciais de provedor cadastradas em `/admin/agentes`, que não fazem parte do seed padrão —
> não foi exercitado o fluxo completo de extração por IA nem o ciclo real de captura por e-mail
> contra uma caixa IMAP real.

### 11. Repository cleanliness check
- `TODO`/`FIXME` remanescentes: os mesmos 2 já conhecidos, ambos prospectivos —
  `src/app/api/files/[...path]/route.ts:50` (autenticação futura) e
  `src/app/admin/layout.tsx:1` (RBAC futuro). Nenhum novo.
- `npx depcheck`: mesmos falsos positivos já documentados (`shadcn`, `tw-animate-css`,
  `@tailwindcss/postcss`, `postcss`, `tailwindcss`, `@types/react-dom`, `eslint-config-next` —
  usadas via CSS/config/CLI, não via `import` estático). `imapflow`, `mailparser` e
  `@types/mailparser` (dependências da captação por e-mail) **não** aparecem como órfãs —
  confirmadas em uso único em `src/lib/email/imap-client.ts`. OpenAI não adicionou dependência
  nova (Responses API via `fetch` nativo), então não há nada novo a verificar ali.
- `db.delete(` fora de `seed.ts`: zero ocorrências reais — os únicos `.delete(` encontrados fora
  do seed são `storage.delete(fileKey)` (limpeza de arquivo em rollback, `src/actions/candidatos.ts`
  e `src/server/candidatos/processar-curriculo-recebido.ts`), não hard delete de banco.

### 12. `git diff --check`
```bash
git diff --check
```
Sem saída — nenhum erro de espaço em branco / conflito de merge residual.

### 13. Busca de segredos
- `.env` confirmado fora do controle de versão (`git ls-files` não lista `.env`, só
  `.env.example`).
- Varredura por padrões de segredo (chaves Google `AIza...`, OpenAI `sk-...`, AWS `AKIA...`,
  Slack `xox...`, blocos `PRIVATE KEY`, tokens `ghp_...`) em todos os arquivos rastreados via
  `git grep`: nenhuma ocorrência.
- `AGENT_CREDENTIALS_ENCRYPTION_KEY` só aparece vazia (`""`) em `.env.example` e como texto
  descritivo em `SECURITY.md` — nunca com valor real.

### 14. `git status`
```bash
git status --short
```
Árvore de trabalho limpa antes desta alteração.

## Ações realizadas neste ciclo

- Docker Desktop foi iniciado (estava parado) e o volume de dados Postgres local foi recriado do
  zero (`docker compose down -v && up -d`) — confirmado explicitamente com o usuário antes de
  executar, por ser destrutivo ao ambiente de desenvolvimento local.
- Nenhum código de aplicação foi alterado — nenhum bloqueador foi encontrado que exigisse
  correção. As migrations `0017`–`0019` (captação por e-mail e banco de talentos), até então
  aplicadas apenas localmente sem essa validação formal, agora estão cobertas.
