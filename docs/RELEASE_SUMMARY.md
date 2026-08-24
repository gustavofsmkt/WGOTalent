# Release Summary — WGOTalent MVP v1 (Greenfield)

> Fechamento do marco greenfield (TASK-130). Consolida em um único documento o
> que o MVP entrega, sem introduzir nenhuma feature nova — apenas resume o
> estado já validado em [FINAL_VALIDATION.md](FINAL_VALIDATION.md) e
> [PROJECT_STATE.md](PROJECT_STATE.md).

**Data do fechamento**: 2026-08-24
**Tag local**: `wgo-greenfield-v1`

## Escopo

Plataforma de RH para gestão de departamentos, cargos, vagas, candidatos e
triagem de candidatos com apoio de IA (ver [PRODUCT.md](PRODUCT.md)).

Capacidades entregues:
- CRUD completo (criar/ver/editar/soft-delete) de Departamento, Cargo, Vaga,
  Candidato e Triagem.
- Pipeline de triagem com `etapa`/`resultado`/`motivo` como campos distintos,
  visão Kanban e visão em lista, e parecer de RH por etapa (5 colunas, uma
  por etapa, edição inline com salvamento único — ver migration
  `0014_triagens_parecer_rh_por_etapa.sql`).
- Cadastro de candidato manual e em lote (upload de currículo).
- Extração, classificação e avaliação de candidatos via motor de agentes de
  IA nativo (ADR-0007), configurável via `/admin/agentes` e
  `/admin/credenciais`.
- Dashboard com KPIs, funil por etapa, desfechos e atividade recente.

Fora de escopo (decisão de produto, não pendência): autenticação/autorização,
storage em nuvem, UI com modais/rotas paralelas/interceptadas, hard deletes,
escrita direta de serviços externos no banco. Ver
["Fora de Escopo" em PRODUCT.md](PRODUCT.md#fora-de-escopo-mvp).

## Arquitetura

Next.js 16+ App Router, TypeScript, sem servidor de API separado. Convenções
estritas (ver [ARCHITECTURE.md](ARCHITECTURE.md) e [AGENTS.md](../AGENTS.md)):

- **Leituras** — exclusivamente Server Components, direto da camada Drizzle,
  sempre via `notDeleted()` (`src/server/db/query-helpers.ts`).
- **Escritas internas** — exclusivamente Server Actions (`src/actions/`),
  validação Zod → mutação Drizzle → `revalidatePath`.
- **Escritas externas / streaming de arquivo** — Route Handlers
  (`src/app/api/`), hoje limitado a `GET /api/files/[...path]`.
- **Soft delete universal** — `deleted_at` em toda tabela; cascata é
  responsabilidade da aplicação (transação única), nunca `ON DELETE CASCADE`
  do Postgres.
- **Armazenamento** — abstração `StorageProvider`, implementação local em
  disco (`src/lib/storage/`), fora de `public/`.
- **IA** — motor de agentes nativo (`src/server/agents/`,
  `src/lib/agents/`), substituindo a integração via n8n originalmente
  planejada (ADR-0007, que supera ADR-0004/0005/0006).

`create-t3-app` foi usado só como scaffolder inicial — a aplicação não usa
tRPC, Prisma nem Auth.js/NextAuth (proibidos explicitamente no MVP, ver
[AGENTS.md](../AGENTS.md#stack-restrictions)).

## Schema

Fonte canônica: [db_triagem_proposta.ts](db_triagem_proposta.ts).

Entidades: `Departamento` 1—N `Cargo` 1—N `Vaga`; `Candidato` 1—N `Triagem`
N—1 `Vaga`; `Triagem` 1—1 `AvaliacaoIA`; `Candidato` 1—N
`CandidatoFormacao`/`CandidatoExperienciaProfissional`/`CandidatoCertificacao`.
Mais duas tabelas de suporte ao motor de IA (configuração de agente por slot
e credenciais de provedor cifradas).

17 migrations aplicadas (`drizzle/0000`…`0016`), cobrindo criação de todas as
tabelas, ajustes de nullability/índices únicos, criação das tabelas do motor
de agentes, o parecer de RH por etapa e o relaxamento de e-mail/celular do
candidato para nullable+unique. Todas idempotentes e validadas de ponta a
ponta contra um volume Postgres vazio em `FINAL_VALIDATION.md`.

## Formulários

TanStack Form (`@tanstack/react-form`) em todos os formulários de entidade,
validados por schema Zod compartilhado entre client e Server Action
(`src/lib/validation/`). Padrões consolidados nas auditorias TASK-117/119:
validação por campo no `onBlur` (não no formulário inteiro), sem
`onChange` redundante, `candidato-form` tipado com o `ReactFormExtendedApi`
real (sem `any`), inputs protegidos contra `null` em campos opcionais
(`email`/`celular`).

## UI

Design consolidado em [DESIGN.md](DESIGN.md), a partir das referências
visuais em `docs/references/ui/` (ver
[UI_REFERENCE_ANALYSIS.md](UI_REFERENCE_ANALYSIS.md) e
[UI_REFERENCE_MAP.md](UI_REFERENCE_MAP.md)). Componentes shadcn/ui como base
(`src/components/ui/`, nunca editados diretamente), envolvidos por wrappers
com estilo Tailwind próprio quando necessário. `PageHeader` e
`DataEmptyState` padronizados em todas as páginas de listagem/detalhe
(TASK-117). Responsivo (mobile/tablet/desktop), sem biblioteca externa de
gráficos — funil e KPIs do dashboard são CSS puro.

## Storage, Intake e IA

- **Storage** — `StorageProvider` grava currículos (PDF/DOCX/PNG/JPEG) fora
  de `public/`, com chave gerada por UUID (nunca por nome de arquivo
  enviado), servidos via `GET /api/files/[...path]`. Sem validação de tipo
  de conteúdo/malware/tamanho — risco aceito conscientemente para o MVP (ver
  [SECURITY.md](SECURITY.md#currículo-arquivo)).
- **Intake** — cadastro manual (`/candidatos/novo`) e upload em lote
  (`/candidatos/upload-lote`); e-mail duplicado restaura/mescla o candidato
  (ADR-0008) em vez de rejeitar por conflito (substitui ADR-0002).
- **Motor de IA** — pipeline nativo `extração → classificação → avaliação`
  (`src/server/agents/`) via `@google/genai`, configurável por slot em
  `/admin/agentes`; credenciais de provedor cifradas em repouso
  (AES-256-GCM, `src/lib/agents/crypto.ts`) e nunca expostas fora da camada
  de repository (ADR-0007, SECURITY.md).

## Testes

- 48 arquivos de teste / 390 testes (Vitest), todos verdes na validação
  final.
- Cobertura em repositories, Server Actions, validação Zod, motor de
  agentes (extração/classificação/avaliação/orquestração), storage,
  cripto de credenciais e rota de arquivos.
- Gates npm: `check` = `lint && test:run && build`; `check:integration` =
  `db:migrate && db:smoke`.
- Validação de ponta a ponta contra banco/volume Docker vazio documentada em
  [FINAL_VALIDATION.md](FINAL_VALIDATION.md) (14 etapas, todas PASS).

## Harness

Governança e localização de artefatos de IA descritas em
[HARNESS.md](HARNESS.md): skills técnicas em `.claude/skills/`
(`.github/skills/` e `.claude/skills/` como caminhos equivalentes),
instruções Copilot modularizadas em `.github/instructions/`, agentes
customizados em `.github/agents/`, política de skill mínima por tarefa,
proibição de Postgres MCP (fluxo exclusivo via Drizzle) e preferência do CLI
oficial do shadcn sobre MCP.

## Limitações conhecidas (aceitas para o MVP, não pendências esquecidas)

- **Sem autenticação/autorização** — sistema totalmente aberto, incluindo
  `/admin/agentes` e `/admin/credenciais`; não deve ser exposto em rede
  pública ([SECURITY.md](SECURITY.md#ausência-de-autenticação-no-mvp)).
- **Soft delete não é anonimização** — dado de candidato soft-deletado
  permanece integralmente no banco e o currículo permanece em disco; não
  atende sozinho a um pedido de expurgo (ex. LGPD).
- **Rota de arquivos sem verificação de autorização** — `GET
  /api/files/[...path]` isola o caminho em disco mas não valida quem pode
  acessar (dependente da ausência de auth acima).
- **Sem scan de conteúdo no upload** — `StorageProvider.save()` não valida
  tipo real, tamanho ou malware; responsabilidade de quem chama.
- **Rotação de chave de cifragem é destrutiva sem replano** —
  `AGENT_CREDENTIALS_ENCRYPTION_KEY` trocada sem re-cifrar as credenciais
  existentes as torna permanentemente ilegíveis.
- **212 warnings de lint pré-existentes** (`@typescript-eslint/no-unused-vars`)
  e 8 vulnerabilidades de `npm audit` (4 moderate, 4 high) em árvores de
  dependências de terceiros — nenhuma bloqueante, fora do escopo desta
  task de fechamento.
- **2 TODOs prospectivos no código** —
  `src/app/api/files/[...path]/route.ts:50` (autenticação futura) e
  `src/app/admin/layout.tsx:1` (RBAC futuro).

## Comandos de reprodução

```bash
npm ci
npm run check
git tag -l wgo-greenfield-v1
git show wgo-greenfield-v1 --stat
```
