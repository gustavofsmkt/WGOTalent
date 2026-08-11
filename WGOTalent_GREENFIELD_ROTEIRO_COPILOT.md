# WGOTalent — Roteiro Greenfield de Implementação com GitHub Copilot Chat

## Objetivo

Construir o WGOTalent em **um repositório novo, do zero**, usando um harness versionado para orientar o GitHub Copilot Chat e mantendo apenas artefatos que pertençam ao escopo do produto.

Este roteiro substitui os roteiros anteriores de migração. Não existe Prisma, Supabase, schema legado ou aplicação antiga a preservar. O **Create T3 App será usado somente como scaffolder** da fundação Next.js + TypeScript + Tailwind + Drizzle + PostgreSQL; o WGOTalent **não será uma aplicação tRPC/T3 completa**.

## Preparação única

1. Crie uma pasta vazia para o novo projeto.
2. Extraia `WGOTalent_GREENFIELD_BOOTSTRAP.zip` dentro dela. Isso criará apenas `.bootstrap/` com as duas specs e as skills fornecidas.
3. Abra essa pasta no VS Code.
4. Inicie pela TASK-001.
5. A partir daí, deixe o Copilot executar terminal, criar/editar/remover arquivos, instalar dependências e testar.
6. Antes da TASK-065, coloque a pasta de referências visuais/layout no repositório em qualquer localização claramente identificável (por exemplo `Referencias_Paginas/`). Não reorganize manualmente: a TASK-065 fará o inventário, a limpeza e a normalização para `docs/references/ui/`.

## Fontes canônicas e precedência

O projeto começa com:

- `docs/specs/db_triagem_proposta.ts`: modelo de dados canônico.
- `docs/specs/hr-platform-nextjs-architecture-prompt.md`: arquitetura canônica.

Quando houver conflito, use esta ordem:

1. ADR mais recente e explicitamente aprovado do WGOTalent;
2. specs canônicas;
3. documentação oficial da **versão realmente instalada** da biblioteca/framework;
4. `.github/copilot-instructions.md` e path instructions;
5. skills do projeto;
6. conhecimento geral do modelo.

As skills são guias. Não copie exemplo incompatível com a versão instalada.

### Referências visuais

As referências de layout são uma **fonte visual**, não uma fonte de requisitos funcionais.

Precedência para decisões de interface:
1. specs funcionais + ADRs;
2. `docs/DESIGN.md`;
3. `docs/UI_REFERENCE_MAP.md`;
4. referências visuais específicas apontadas pelo mapa;
5. shadcn/Tailwind/skills.

Uma referência visual pode orientar composição, hierarquia, densidade, responsividade e aparência, mas **não pode criar campo, entidade, rota, regra de negócio ou feature ausente das specs/ADRs**.

## Stack congelada

### Scaffold
- **Create T3 App somente como scaffolder**, não como arquitetura obrigatória de runtime.
- opções selecionadas no scaffold: Next.js App Router, TypeScript, Tailwind CSS, Drizzle e PostgreSQL.
- **não selecionar tRPC**.
- **não selecionar Auth.js/NextAuth** no MVP.
- **não selecionar Prisma**.
- após o scaffold, o código pertence ao WGOTalent; não existe dependência conceitual futura do projeto em “T3 Stack”.

### Aplicação
- Next.js App Router, TypeScript, React correspondente à versão instalada.
- estrutura `src/` preservada do Create T3 App.
- npm.
- PostgreSQL 16 local via Docker Compose.
- extensão `unaccent`.
- Drizzle ORM + Drizzle Kit + driver PostgreSQL `postgres` gerado pelo Create T3 App, salvo incompatibilidade comprovada.
- `src/server/db/index.ts` como cliente Drizzle server-only.
- `src/server/db/schema.ts` como implementação canônica do schema.
- `src/env.js` como validação tipada de ambiente; não criar uma segunda solução paralela.
- shadcn/ui.
- Tailwind CSS.
- TanStack Form (`@tanstack/react-form`).
- integração Next.js do TanStack Form somente se necessária pela API instalada.
- Zod v4, preferindo suporte Standard Schema nativo do TanStack Form.
- Vitest para testes TypeScript.
- StorageProvider local para currículos.
- n8n externo: nunca escreve no PostgreSQL.

### Padrões obrigatórios

- Reads internas: Server Components.
- Writes internas: Server Actions.
- Route Handlers: somente webhook externo e streaming de arquivos.
- `src/server/db/schema.ts` é a implementação canônica do schema.
- migrations: `drizzle-kit generate` -> revisar SQL -> `drizzle-kit migrate`.
- `drizzle-kit push` não é workflow oficial.
- soft delete em todas as entidades da spec.
- `Candidato` soft-delete cascata na aplicação para filhos/Triagens/AvaliacaoIA.
- `AvaliacaoIA` é 1:1 de Triagem e aparece inline; não há CRUD próprio.
- formulários: TanStack Form + Zod + shadcn.
- currículos nunca ficam em `public/`.

## Fora de escopo

Não adicionar: Prisma, Supabase, **tRPC**, Auth.js/NextAuth no MVP, React Hook Form, API REST interna de CRUD, backend separado, Redis, Kafka, Kubernetes, S3/Blob no MVP, n8n no Compose, escrita n8n->DB, múltiplos ORMs ou dois sistemas de formulário. O Create T3 App é apenas o scaffolder inicial.

## Regras permanentes de limpeza

Toda TASK que **substituir** algo deve remover na mesma TASK:

- implementação antiga;
- arquivo antigo;
- import/export antigo;
- rota antiga;
- dependência que ficar órfã;
- documentação operacional superseded;
- componente/asset sem uso causado pela troca;
- referência visual duplicada, temporária ou comprovadamente fora do escopo quando a TASK de referências fizer essa classificação.
- boilerplate do Create T3 App que não pertença ao WGOTalent, incluindo exemplos `Post`/demo, `start-database.sh`, `db:push` e qualquer resíduo tRPC/Auth que apareça por configuração incorreta.

Não manter implementações paralelas “por garantia”. Histórico arquitetural fica em ADR, não em código morto.

Antes de cada commit, pesquisar referências ao item removido. No fechamento haverá auditoria de todos os arquivos versionados.

## Uso do Copilot

- uma TASK por conversa nova;
- Agent mode;
- modelo recomendado da TASK;
- uma mudança pequena por vez;
- testes antes de sucesso;
- commit local atômico;
- nunca `git push` automático;
- não usar `git add -A` sem revisar o diff.

## Modelos

- **Gemini 3.6 Flash:** execução mecânica, instalação, arquivos, UI simples, Docker, testes e limpeza.
- **Gemini 3.1 Pro:** arquitetura, ADRs, modelagem, constraints, transactions, forms complexos, webhook, revisão e segurança.

## Skills fornecidas pelo `claude.zip`

As skills ficam em `.claude/skills/`, localização suportada pelo Copilot. Use apenas as relevantes à TASK:

- `nextjs-app-router-patterns`
- `react-best-practices`
- `shadcn`
- `tailwind-design-system`
- `tailwind-css-patterns`
- `tanstack-form`
- `zod-validation-utilities`
- `building-components`
- `vercel-composition-patterns`
- `impeccable`

### Regra de compatibilidade das skills

- TanStack Form: confirme a versão instalada. Prefira Zod por Standard Schema quando suportado; não instale `@tanstack/zod-form-adapter` só porque um exemplo antigo da skill o mostra.
- shadcn: use `shadcn info/docs/search` antes de reinventar componentes.
- Tailwind: tokens semânticos do projeto vencem exemplos com cores raw.
- Impeccable: respeitar passes limitados; sem loop infinito de polimento.

---

# Fase 0 — Bootstrap e fonte de verdade

## TASK-001 — Inicializar o repositório vazio

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Execute esta tarefa; não apenas explique.

1. Confirme que a pasta atual contém `.bootstrap/` e não contém projeto anterior.
2. Leia `.bootstrap/README.md`.
3. Inicialize Git com branch `main`.
4. Crie `.gitignore` para `.env*` (exceto `.env.example`), node_modules, .next, coverage, logs, storage, volumes/dados locais e arquivos temporários de SO/editor.
5. Crie README.md mínimo com nome WGOTalent e estado "bootstrap".
6. Não mova `.bootstrap` ainda.
7. Não instale dependências.
8. Rode `git status --short` e `git diff --check`.
9. Faça commit local `chore: initialize wgo talent repository`.
10. Não faça push.
```

## TASK-002 — Importar specs e skills e remover o bootstrap

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Execute esta tarefa.

1. Verifique os dois arquivos de spec e todos os diretórios em `.bootstrap/claude-skills/`.
2. Crie `docs/specs/`.
3. Mova sem reescrever:
   - `.bootstrap/db_triagem_proposta.ts` -> `docs/specs/db_triagem_proposta.ts`;
   - `.bootstrap/hr-platform-nextjs-architecture-prompt.md` -> `docs/specs/hr-platform-nextjs-architecture-prompt.md`.
4. Mova `.bootstrap/claude-skills/*` para `.claude/skills/`, preservando SKILL.md, references, rules, scripts, metadata e assets.
5. Não copie `.claude/settings.local.json`; só as skills são parte do projeto.
6. Crie `docs/SKILLS_MANIFEST.md` com nome, descrição e uso recomendado de cada skill.
7. Se a spec arquitetural referenciar `bd_triagem_proposta.ts`, corrija apenas o filename para `db_triagem_proposta.ts` e registre uma nota de correção editorial; não mude requisito.
8. Remova `.bootstrap/` por completo.
9. Pesquise `.bootstrap` e confirme zero referências.
10. Faça commit `docs: import canonical specs and agent skills`.
```

## TASK-003 — Auditar as specs canônicas

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Leia somente as duas specs em `docs/specs/` e crie `docs/SPEC_AUDIT.md`.

Classifique:
- regras fechadas;
- questões explicitamente abertas;
- decisões que exigem ADR antes do schema;
- critérios de aceitação derivados.

Identifique obrigatoriamente:
- `texto_curriculo_extraido` marcado como dúvida;
- idempotência do webhook;
- candidato soft-deleted recebido novamente;
- semântica de delete de Departamento/Cargo/Vaga com dependências;
- payload n8n;
- unique simples + soft delete;
- partial unique de Triagem em andamento.

Não decida ainda. Não modifique specs.
Faça commit `docs: audit canonical project specifications`.
```

# Fase 1 — Harness

## TASK-004 — Criar PRODUCT.md e PROJECT_STATE.md

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `docs/PRODUCT.md` e `docs/PROJECT_STATE.md` usando apenas as specs.

PRODUCT: problema, usuários, entidades, capacidades do MVP, fora de escopo.
PROJECT_STATE: greenfield, stack congelada, arquitetura resumida, decisões pendentes e links para specs/ADRs.

Não replique os campos do schema.
Faça commit `docs: define product and project state`.
```

## TASK-005 — Criar ARCHITECTURE.md

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `nextjs-app-router-patterns`

### Prompt para o Copilot Chat

```text
Crie `docs/ARCHITECTURE.md`.

Obrigatório:
Create T3 App = scaffolder inicial apenas.
Browser -> Next.js App Router -> Drizzle -> PostgreSQL.
Reads -> Server Components.
Writes internos -> Server Actions.
n8n externo -> webhook Next -> Zod -> transaction Drizzle.
Arquivos -> StorageProvider -> Route Handler.
AvaliacaoIA inline em Triagem.
Postgres em Docker; n8n fora do Compose.

Preserve a convenção `src/` do scaffold:
- `src/app`;
- `src/actions`;
- `src/components`;
- `src/lib`;
- `src/server/db`;
- `src/styles`;
- `src/env.js`.

Não introduza `src/server/api`/tRPC, Auth.js ou outra camada apenas porque fazem parte de outras combinações T3.
Inclua Mermaid, fronteiras de confiança, diretórios e regra de limpeza/substituição.
Proíba API REST interna de CRUD e DB em Client Components.
Faça commit `docs: define greenfield architecture`.
```

## TASK-006 — Criar DEVELOPMENT_METHOD.md

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `docs/DEVELOPMENT_METHOD.md` com o fluxo:
ESPECIFICAR -> PLANEJAR -> IMPLEMENTAR -> VALIDAR -> REVISAR -> EXPLICAR -> REGISTRAR -> LIMPAR.

Inclua uma TASK por conversa, contexto mínimo, skills mínimas, planos para mudanças transversais, commits atômicos, docs como memória persistente, testes e regra de substituição+cleanup.
Faça commit `docs(harness): define agent development method`.
```

## TASK-007 — Criar copilot-instructions.md

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `.github/copilot-instructions.md`, conciso, aproximadamente 140-180 linhas no máximo.

Inclua:
- precedência de fontes;
- stack e regra **T3 como scaffolder somente**;
- proibir tRPC, Auth.js/NextAuth e Prisma no MVP;
- preservar a estrutura `src/` útil gerada pelo scaffold;
- `src/server/db/schema.ts`, `src/server/db/index.ts` e `src/env.js` são convenções estruturais aprovadas do scaffold;
- Server Components / Server Actions / Route Handlers restritos;
- Drizzle schema-first e generate->review->migrate;
- proibir push;
- notDeleted em leituras;
- soft delete global e cascade de Candidato;
- n8n nunca escreve DB;
- TanStack Form + Zod + shadcn/Tailwind;
- docs da versão instalada vencem exemplos antigos de skill;
- uma tarefa por chat;
- contexto mínimo;
- sem dependências fora de escopo;
- substituição implica cleanup;
- testes, segredos e no-push.

Referencie docs em vez de duplicá-los.
Faça commit `chore(harness): add copilot repository instructions`.
```

## TASK-008 — Criar instruções Next.js

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `nextjs-app-router-patterns`, `react-best-practices`

### Prompt para o Copilot Chat

```text
Crie `.github/instructions/nextjs.instructions.md` para `src/app/**/*.ts`, `src/app/**/*.tsx` e `src/actions/**/*.ts`.

Regras: Server Component por padrão; `use client` no menor boundary; reads direto da camada DB; writes em Server Actions; revalidatePath; Route Handler não é BFF interno; não fazer fetch server->própria API; loading/error/not-found; cleanup ao substituir padrão.
Faça commit `chore(harness): add nextjs path instructions`.
```

## TASK-009 — Criar instruções Drizzle/Postgres

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `.github/instructions/database.instructions.md` aplicável a `src/server/db/**`, `drizzle/**`, `drizzle.config.ts`, `infra/postgres/**` e scripts DB.

Inclua schema canônico+ADRs, migrations versionadas, sem push, revisar SQL, notDeleted, soft delete em todas entidades, unique/partial unique conforme spec, zero hard delete na app, seed fictício, integration DB e cleanup de schema/helper substituído.
Faça commit `chore(harness): add database instructions`.
```

## TASK-010 — Criar instruções de formulários

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `tanstack-form`, `zod-validation-utilities`, `shadcn`

### Prompt para o Copilot Chat

```text
Crie `.github/instructions/forms.instructions.md` aplicável a `src/components/**/*form*.tsx`, `src/lib/validation/**` e formulários em `src/app/**`.

Regras:
- TanStack Form + Zod v4 + shadcn;
- conferir docs da versão instalada antes de adapters;
- preferir Standard Schema;
- TanStack = estado/UX; Zod server = boundary de segurança;
- evitar regra divergente client/server;
- Field/FieldGroup shadcn quando disponíveis;
- erros acessíveis, onBlur, subscriptions específicas;
- superRefine para invariantes de Triagem;
- remover helper/form substituído.
Faça commit `chore(harness): add form instructions`.
```

## TASK-011 — Criar instruções de UI/design

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `shadcn`, `tailwind-design-system`, `tailwind-css-patterns`, `building-components`, `vercel-composition-patterns`, `impeccable`

### Prompt para o Copilot Chat

```text
Crie `.github/instructions/ui.instructions.md` aplicável a `src/components/**/*.tsx`, `src/app/**/*.tsx` e `src/styles/globals.css`.

Defina tokens semânticos, mobile-first, acessibilidade, shadcn antes de primitive custom, composição antes de boolean props, um sistema de ícones, Impeccable para superfícies/auditoria, sem componentes não usados e cleanup da versão substituída. Antes de criar/alterar uma superfície, consultar `docs/UI_REFERENCE_MAP.md`; abrir somente as referências mapeadas para a superfície; `docs/DESIGN.md` define regras globais; screenshots não podem criar campos/features fora das specs.
Faça commit `chore(harness): add ui design instructions`.
```

## TASK-012 — Criar instruções de integrações/storage

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `zod-validation-utilities`, `nextjs-app-router-patterns`

### Prompt para o Copilot Chat

```text
Crie `.github/instructions/integrations.instructions.md` para `src/app/api/webhooks/**`, `src/app/api/files/**`, `src/lib/storage/**` e documentação de integração.

Regras: n8n externo, Next source of truth, shared secret, Zod boundary, idempotência, transaction, n8n sem DATABASE_URL, storage fora public, impedir path traversal, sem log de currículo/payload completo e cleanup do contrato/route substituído.
Faça commit `chore(harness): add integration instructions`.
```

## TASK-013 — Criar instruções de testes e documentação

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie `tests.instructions.md` e `docs.instructions.md` em `.github/instructions/`.

Tests: Vitest, unit sem DB quando possível, integration em Postgres local descartável, regressão para bug, migrations em DB vazio, dados fictícios, nunca remover teste para passar.
Docs: português, ADR Contexto/Decisão/Consequências, DEVLOG factual, prompts-log só marcos, não duplicar schema, remover docs operacionais superseded.
Faça commit `chore(harness): add tests and docs instructions`.
```

## TASK-014 — Criar custom agents

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `.github/agents/` com Planner, Implementer, Reviewer e Explainer.

Planner: read/search/web, sem editar produção, plano+critérios+riscos+cleanup.
Implementer: read/search/edit/execute/todos, só task aprovada, cleanup, testes, sem push.
Reviewer: read-only, BLOQUEADOR/IMPORTANTE/OPCIONAL, specs/ADR/cleanup/testes.
Explainer: read-only, material técnico em português.

Modelos preferidos: Planner/Reviewer Gemini 3.1 Pro; Implementer/Explainer Gemini 3.6 Flash. Handoffs sem execução automática.
Faça commit `chore(harness): add specialized copilot agents`.
```

## TASK-015 — Criar prompt files

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie `.github/prompts/` com:
new-task, implement-task, review-task, explain-task, new-adr, dev-log e cleanup-audit.

Prompts curtos, usando `${input:...}` quando útil. Não duplicar regras globais. `cleanup-audit` deve procurar arquivo/import/export/dependência/rota/componente órfãos.
Faça commit `chore(harness): add workflow prompt files`.
```

## TASK-016 — Criar skills específicas WGOTalent

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Sem alterar `.claude/skills`, crie `.github/skills/` somente com skills específicas:
- drizzle-migration-check;
- soft-delete-check;
- webhook-contract-check;
- repository-cleanliness-check;
- task-closeout.

Mantenha cada skill pequena e referencie specs/ADRs. Não duplique skills genéricas.
`repository-cleanliness-check` deve procurar arquivo sem referência, fonte duplicada, dependência não usada, rota antiga, componente substituído e TODO de migração.
Faça commit `chore(harness): add wgo project skills`.
```

## TASK-017 — Configurar contexto VS Code e política MCP

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie `.vscode/settings.json` excluindo de busca/contexto: node_modules, .next, coverage, storage, logs, volumes e temporários. Não excluir `src/app`, `src/actions`, `src/lib`, `src/server`, `src/components`, `src/styles`, docs/specs/drizzle/skills.

Crie `docs/HARNESS.md`: locations, `.claude/skills` suportado, skill mínima por tarefa, GitHub MCP opcional, sem Postgres MCP, shadcn CLI preferida a MCP, política de contexto.
Não configure MCP ainda.
Faça commit `chore(harness): optimize copilot context`.
```

## TASK-018 — Validar o harness

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Audite instructions, agents, prompts, skills fornecidas, skills WGOTalent, docs e specs.

Pesquise contradições: Prisma, Supabase, tRPC, Auth.js/NextAuth, n8n escrevendo DB, API CRUD interna, hard delete, React Hook Form, adapter Zod antigo obrigatório, drizzle push, instruções que tratem T3 como framework/runtime obrigatório.
Corrija somente harness/docs.
Crie `docs/DEVLOG.md` e registre o marco.
Execute `git diff --check`.
Faça commit `chore(harness): validate greenfield agent harness`.
```

# Fase 2 — Scaffold limpo

## TASK-019 — Criar fundação mínima com Create T3 App

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `nextjs-app-router-patterns`

### Prompt para o Copilot Chat

```text
Execute esta tarefa. O Create T3 App será usado **somente como scaffolder**.

Objetivo: gerar uma fundação integrada e testada para Next.js + TypeScript + App Router + Tailwind + Drizzle + PostgreSQL, sem transformar o WGOTalent em uma aplicação tRPC/T3 completa.

1. Consulte a documentação oficial atual e execute o `--help` da versão instalada do `create-t3-app` antes de escolher flags; as flags CI são experimentais e podem mudar.
2. Gere o scaffold com as opções equivalentes a:
   - Next.js App Router;
   - TypeScript;
   - Tailwind CSS;
   - Drizzle;
   - PostgreSQL;
   - npm.
3. Explicitamente NÃO selecione:
   - tRPC;
   - Prisma;
   - Auth.js/NextAuth.
4. Prefira, quando ainda suportado pela CLI, a combinação equivalente a:
   `--CI --appRouter --tailwind --drizzle --dbProvider postgres --trpc false --nextAuth false --prisma false --noGit`
   Não copie esse comando cegamente se o `--help` atual mostrar sintaxe diferente; use as opções equivalentes.
5. O repositório já contém `.git`, `.github`, `.claude`, `.vscode` e `docs`. Não permita que o scaffolder apague ou substitua esses artefatos.
6. Como a raiz não está vazia, se necessário gere em diretório temporário, copie para a raiz somente o scaffold legítimo e remova o diretório temporário nesta mesma TASK.
7. Preserve a convenção `src/` gerada pelo Create T3 App.
8. Não inicialize Git novamente.
9. Não instale shadcn, TanStack Form ou Vitest ainda.
10. Não escreva o schema de domínio.
11. Execute `npm install` somente se o scaffolder ainda não tiver instalado.
12. Execute os scripts de lint/check disponíveis e `npm run build`.
13. Registre em `docs/PROJECT_STATE.md` as versões efetivamente instaladas e que T3 foi usado apenas como scaffolder.
14. Faça commit `build: scaffold minimal t3 foundation`.
15. Não faça push.

Critério de aceitação:
- App Router + Tailwind + Drizzle + PostgreSQL configurados;
- estrutura `src/` presente;
- nenhum tRPC/Auth/Prisma selecionado;
- harness/specs preservados;
- build passa.
```

## TASK-020 — Limpar e domesticar o scaffold T3

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `repository-cleanliness-check`

### Prompt para o Copilot Chat

```text
Execute uma limpeza imediata do Create T3 App. O scaffold agora pertence ao WGOTalent.

1. Inspecione todos os arquivos adicionados pela TASK-019.
2. Remova qualquer boilerplate/demonstração que não faça parte do produto, incluindo quando existir:
   - componente/exemplo `Post`;
   - tabela/modelo `post` de demonstração;
   - `_components` de demo;
   - textos/links promocionais T3;
   - exemplo tRPC residual;
   - exemplo Auth residual;
   - assets sem uso;
   - README padrão que concorra com a documentação WGOTalent.
3. Remova `start-database.sh`: o projeto usará `docker-compose.yml` próprio nas TASKs de PostgreSQL.
4. Remova o script `db:push` do `package.json`; o workflow oficial é `db:generate` -> revisar SQL -> `db:migrate`.
5. Mantenha e adapte somente o que é útil:
   - `src/app`;
   - `src/server/db/index.ts`;
   - `src/server/db/schema.ts` sem modelo de exemplo;
   - `src/env.js`;
   - `src/styles/globals.css`;
   - `drizzle.config.ts`;
   - configurações TypeScript/ESLint/Prettier/PostCSS/Tailwind realmente usadas;
   - dependências Drizzle/PostgreSQL/Tailwind necessárias.
6. Não substitua o driver `postgres` gerado pelo T3 por `pg` apenas por preferência; preserve o driver do template salvo incompatibilidade comprovada.
7. Pesquise globalmente por: `trpc`, `nextauth`, `auth.js`, `prisma`, `example`, `post`, `db:push`, `start-database`.
8. Corrija/remova somente ocorrências de runtime/boilerplate; referências em documentação que expliquem o escopo negativo podem permanecer.
9. Deixe `src/app/page.tsx` como uma home mínima WGOTalent, sem feature.
10. Execute lint/check, build e `repository-cleanliness-check`.
11. Faça commit `chore: remove t3 scaffold boilerplate`.

Critério de aceitação:
- nenhuma feature T3 de exemplo;
- nenhum tRPC/Auth/Prisma de runtime;
- sem `start-database.sh`;
- sem `db:push`;
- Drizzle/env/Tailwind úteis preservados;
- build passa.
```

## TASK-021 — Validar a fundação Drizzle e env gerada pelo T3

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Audite a fundação gerada em vez de reinstalá-la.

1. Leia `package.json`, `drizzle.config.ts`, `src/server/db/index.ts`, `src/server/db/schema.ts` e `src/env.js`.
2. Confirme que Drizzle ORM e Drizzle Kit já estão instalados.
3. Confirme o driver PostgreSQL gerado pelo template; preserve `postgres` se for o driver atual do Create T3 App e estiver compatível.
4. Confirme scripts:
   - `db:generate`;
   - `db:migrate`;
   - `db:studio` se útil;
   - ausência de `db:push`.
5. Confirme que o cliente DB está em `src/server/db/index.ts` e é server-only por arquitetura.
6. Confirme que o schema ficará em `src/server/db/schema.ts`.
7. Confirme que `src/env.js` é a única solução de validação tipada de ambiente da aplicação; não crie `lib/env.ts`, `src/lib/env.ts` ou validator paralelo.
8. Atualize `docs/ARCHITECTURE.md`, `docs/PROJECT_STATE.md` e instruções do harness se ainda apontarem para paths sem `src/`.
9. Pesquise por `lib/db`, `app/` na raiz, `actions/` na raiz e outras convenções antigas em documentação operacional do projeto; adapte para `src/` quando se tratar de implementação futura.
10. Não criar schema de domínio.
11. Execute lint/build e `git diff --check`.
12. Faça commit `chore: align project with minimal t3 scaffold` somente se houver alterações versionadas.

Critério: uma única convenção estrutural, baseada no scaffold T3 mínimo, sem reinstalar ou duplicar Drizzle/env.
```

## TASK-022 — Inicializar shadcn/ui

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `shadcn`, `tailwind-design-system`

### Prompt para o Copilot Chat

```text
Use a skill shadcn e a CLI atual.

1. Execute `npx shadcn@latest info --json` quando aplicável.
2. Inicialize shadcn sobre o projeto T3 atual, respeitando:
   - `src/app`;
   - `src/styles/globals.css`;
   - aliases TypeScript existentes.
3. Use CSS variables e Tailwind já instalado pelo T3.
4. Escolha uma base estável compatível com a versão instalada.
5. Escolha um único sistema de ícones e registre em `docs/DESIGN_DECISIONS.md`.
6. Não instalar coleção grande de componentes.
7. Confirme `components.json` e seus aliases para `src/components`, `src/lib` e stylesheet correto.
8. Remova artefato de init não usado.
9. Execute lint/build.
10. Faça commit `build(ui): initialize shadcn`.
```

## TASK-023 — Instalar componentes shadcn fundamentais

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `shadcn`

### Prompt para o Copilot Chat

```text
Instale somente componentes necessários nas próximas fases: button, card, input, textarea, Field/FieldGroup ou equivalente atual, select, checkbox, badge, table, alert, separator, skeleton, empty se existir e mecanismo de toast recomendado pela base atual.

Antes de adicionar, consulte docs/info da versão instalada.
Não instalar charts/calendar/components sem uso próximo.
Confirme que os componentes entram em `src/components/ui` e que não foi criada uma segunda árvore `components/` na raiz.
Execute lint/build.
Faça commit `build(ui): add foundational shadcn components`.
```

## TASK-024 — Instalar TanStack Form e consolidar Zod

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `tanstack-form`, `zod-validation-utilities`

### Prompt para o Copilot Chat

```text
Consulte a documentação atual do TanStack Form e a versão de Zod já presente no scaffold T3.

1. Preserve Zod existente se já for uma versão v4 compatível; atualize apenas se necessário e seguro.
2. Instale `@tanstack/react-form`.
3. Instale `@tanstack/react-form-nextjs` somente se a API atual realmente for necessária para o padrão de Server Actions escolhido.
4. Não instalar React Hook Form.
5. Não instalar `@tanstack/zod-form-adapter` salvo se a versão instalada realmente exigir; prefira Standard Schema nativo.
6. Não criar segundo pacote/validator Zod.
7. Crie `docs/FORM_STACK.md` com versões e padrão escolhido.
8. Execute lint/build.
9. Faça commit `build(forms): add tanstack form and consolidate zod`.
```

## TASK-025 — Configurar Vitest

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Instale/configure Vitest minimamente para schemas, helpers e lógica de domínio.
Não adicionar Jest nem Playwright.
Crie scripts `test` e `test:run` sem duplicar scripts existentes.
Crie um teste útil pequeno para validar a configuração e remova qualquer teste de exemplo sem valor.
Execute test/lint/build.
Faça commit `build(test): configure vitest`.
```

## TASK-026 — Estender o ambiente tipado do T3

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `zod-validation-utilities`

### Prompt para o Copilot Chat

```text
Use `src/env.js` gerado pelo Create T3 App como **única fonte de validação tipada de environment variables**.

1. Não criar `lib/env.ts`, `src/lib/env.ts` ou segundo mecanismo de env.
2. Preserve `DATABASE_URL` já configurado pelo scaffold Drizzle/PostgreSQL.
3. Adicione apenas variáveis server-side necessárias ao WGOTalent neste estágio:
   - `WEBHOOK_N8N_SECRET`;
   - `STORAGE_ROOT`;
   - outras somente se já houver requisito concreto.
4. Atualize `.env.example` de forma coerente.
5. Segredos nunca `NEXT_PUBLIC_*`.
6. Falhar cedo no servidor quando variável obrigatória faltar.
7. Teste parsing/mensagens sem expor segredo.
8. Remova variável de exemplo T3 que tenha ficado órfã.
9. Execute test/lint/build.
10. Faça commit `feat(config): extend t3 typed environment`.
```

# Fase 3 — Decisões abertas

## TASK-027 — Criar estrutura de ADRs

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `docs/decisions/README.md` com template: Status, Contexto, Decisão, Consequências, Alternativas e Supersede/Superseded-by.
Crie índice.
Não documentar decisão já fixa apenas para aumentar volume.
Faça commit `docs(adr): initialize decision records`.
```

## TASK-028 — Decidir texto_curriculo_extraido

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie ADR para `Candidato.texto_curriculo_extraido`.

Use minimização de PII e as specs. Como o projeto é greenfield, mantenha o campo somente se houver função clara no contrato n8n, auditoria ou produto. Se não houver consumidor definido, remova o campo da spec canônica antes do schema e registre por que.
Não manter "talvez".
Faça commit `docs(adr): decide extracted resume text retention`.
```

## TASK-029 — Decidir idempotência do webhook

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie ADR de idempotência do webhook.

A solução deve distinguir retry do mesmo evento de uma nova candidatura futura. Preferência: `x-idempotency-key` obrigatório e persistência UNIQUE mínima no banco.
Se isso exigir campo/tabela operacional ausente da spec, estenda a spec de forma explícita e justificada pelo ADR.
Não implementar ainda.
Faça commit `docs(adr): define n8n webhook idempotency`.
```

## TASK-030 — Decidir webhook para candidato soft-deleted

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie ADR.

Contexto: email é UNIQUE simples e soft delete não libera email.
Decisão padrão segura: webhook não reativa silenciosamente; retorna conflito de domínio e uma reativação futura deve ser ação explícita do RH.
Não criar novo candidato com mesmo email.
Faça commit `docs(adr): define webhook behavior for deleted candidate`.
```

## TASK-031 — Decidir soft delete com dependências organizacionais

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie ADR para Departamento/Cargo/Vaga.

Decisão recomendada:
- bloquear soft delete de Departamento com Cargo ativo;
- bloquear soft delete de Cargo com Vaga ativa;
- soft delete de Vaga não apaga Triagens históricas;
- listas/options escondem deleted; detalhes históricos podem hidratar referências deleted quando necessário.

Não implementar ainda.
Faça commit `docs(adr): define organizational soft delete semantics`.
```

## TASK-032 — Fechar contrato conceitual do webhook n8n

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `docs/N8N_WEBHOOK_CONTRACT.md` a partir das specs e ADRs.

Defina payload v1: idempotency key, candidato, formações, experiências, certificações, referência de vaga, triagem, AvaliacaoIA, dados do arquivo, obrigatórios/opcionais, resposta e erros.
Shared secret conforme spec.
Não implementar n8n e não inventar workflow.
Faça commit `docs(integration): define n8n webhook contract`.
```

# Fase 4 — PostgreSQL local

## TASK-033 — Criar Docker Compose somente com PostgreSQL

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie `docker-compose.yml` com apenas PostgreSQL 16.
Use env, volume nomeado, healthcheck e porta local necessária.
Não adicionar Next, n8n, Apache, Redis ou outro serviço.
Confirme que `start-database.sh` do Create T3 App foi removido na TASK-020; Docker Compose passa a ser a única forma oficial de subir o PostgreSQL local.
Atualize `.env.example` sem segredo real.
Execute `docker compose config`.
Faça commit `build(db): add local postgres compose`.
```

## TASK-034 — Habilitar unaccent

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Primeiro verifique em container temporário se a imagem PostgreSQL escolhida já possui arquivos da extensão `unaccent`.

Se não possuir, crie `infra/postgres/Dockerfile` instalando somente o pacote correto para PostgreSQL 16/base usada e atualize Compose.
Crie `infra/postgres/init/001-unaccent.sql` com `CREATE EXTENSION IF NOT EXISTS unaccent;`.
Teste em volume temporário; não apagar dados importantes.
Faça commit `build(db): enable postgres unaccent`.
```

## TASK-035 — Criar db:smoke

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie script `db-smoke-test` que valide Postgres, SELECT 1, extensão unaccent e `SELECT unaccent('João')` sem imprimir senha.
Adicione `npm run db:smoke`.
Execute.
Faça commit `test(db): add postgres smoke test`.
```

# Fase 5 — Drizzle e schema

## TASK-036 — Revisar e adaptar drizzle.config.ts do T3

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Revise o `drizzle.config.ts` gerado pelo Create T3 App em vez de recriá-lo do zero.

1. Preserve configurações corretas do template.
2. Garanta:
   - dialect PostgreSQL;
   - schema `./src/server/db/schema.ts`;
   - migrations versionadas em `./drizzle`;
   - DATABASE_URL obtida do ambiente de forma compatível com Drizzle Kit;
   - nenhum segredo hardcoded;
   - nenhum uso de `push` como workflow oficial.
3. Não crie uma segunda configuração Drizzle.
4. Valide o carregamento da config sem aplicar mudança no banco.
5. Execute lint/build quando aplicável.
6. Faça commit `chore(db): align t3 drizzle configuration` somente se houver alteração.
```

## TASK-037 — Revisar e endurecer o cliente Drizzle do T3

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Revise e endureça `src/server/db/index.ts` gerado pelo Create T3 App em vez de substituir a integração por outra convenção.

1. Preserve o driver PostgreSQL `postgres` gerado pelo template se estiver compatível.
2. Preserve Drizzle + schema de `src/server/db/schema.ts`.
3. Use `src/env.js`/env validado pela aplicação para DATABASE_URL quando compatível com o contexto de runtime.
4. Garanta que o módulo seja server-only e não seja importável por Client Components por arquitetura.
5. Não trocar para `pg`/node-postgres sem incompatibilidade comprovada.
6. Não incluir query de negócio.
7. Crie smoke de conexão separado se necessário.
8. Execute lint/build.
9. Faça commit `refactor(db): harden t3 drizzle client` somente se houver alteração.
```

## TASK-038 — Criar helper notDeleted

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Consulte a API/tipos da versão Drizzle instalada e crie `src/server/db/query-helpers.ts` com um padrão central `notDeleted` que reduza risco de esquecer `deleted_at IS NULL` sem esconder joins/queries.
Crie teste/tipo ou exemplo verificável.
Não criar abstraction genérica excessiva.
Faça commit `feat(db): add soft delete query helpers`.
```

## TASK-039 — Criar primitives e enums do schema

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Inicie `src/server/db/schema.ts` apenas com primitives compartilhados e enums definidos na spec: timestamps, deletedAt, status de Vaga, estado civil, CNH, origem, etapa/resultado/motivo de Triagem.
Não criar tabelas.
Banco snake_case, TS camelCase quando claro.
Lint/build.
Faça commit `feat(db): define schema primitives and enums`.
```

## TASK-040 — Implementar Departamento

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Implemente somente `departamentos` conforme spec: UUID, timestamps, deleted_at, nome UNIQUE NOT NULL e descricao.
Não criar Cargo.
Lint/build.
Faça commit `feat(db): define departments table`.
```

## TASK-041 — Implementar Cargo

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Implemente somente `cargos`: departamento_id FK indexed, titulo, descricao, ativo, faixa_salarial, requisitos, requisitos_desejaveis, criterios_eliminatorios, timestamps/deleted_at.
Não criar Vaga.
Faça commit `feat(db): define roles table`.
```

## TASK-042 — Implementar Vaga

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Implemente `vagas`: status, posicoes_disponiveis SMALLINT CHECK >0, cargo_id, remuneracao_oferecida, cidade, uf, timestamps/deleted_at e índices conforme spec.
Lint/build.
Faça commit `feat(db): define job openings table`.
```

## TASK-043 — Implementar Candidato

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Implemente `candidatos` exatamente conforme spec após ADR-028.
Email UNIQUE NOT NULL, celular NOT NULL, pessoais/endereço/preferências/disponibilidade/links/origem/curriculo_arquivo_key e texto extraído apenas se mantido pelo ADR.
FKs opcionais para cargo_interesse/area_interesse.
Todos timestamps/deleted_at.
Lint/build.
Faça commit `feat(db): define candidates table`.
```

## TASK-044 — Implementar CandidatoFormacao

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Implemente `candidato_formacoes` conforme spec, incluindo candidato_id, campos acadêmicos, datas, timestamps/deleted_at e índice.
Não usar hard cascade como substituto do soft delete.
Faça commit `feat(db): define candidate education table`.
```

## TASK-045 — Implementar CandidatoExperienciaProfissional

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Implemente `candidato_experiencias` conforme spec, com data_saida nullable para experiência atual, timestamps/deleted_at e índice.
Não persistir duração derivada.
Faça commit `feat(db): define candidate experience table`.
```

## TASK-046 — Implementar CandidatoCertificacao

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Implemente `candidato_certificacoes` conforme spec, timestamps/deleted_at e índice.
Faça commit `feat(db): define candidate certification table`.
```

## TASK-047 — Implementar Triagem e partial unique

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Implemente `triagens`: vaga_id, candidato_id, etapa, resultado, motivo, parecer_rh, parecer_rh_data, timestamps/deleted_at e índices.
Implemente partial unique `(candidato_id, vaga_id) WHERE resultado = 'em_andamento'` usando a API correta do Drizzle instalado.
Não usar UNIQUE total do par.
Não incluir dados de IA.
Faça commit `feat(db): define screenings table and active uniqueness`.
```

## TASK-048 — Implementar AvaliacaoIA

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Implemente `avaliacao_ia`: triagem_id UNIQUE, vaga_foi_inferida, pontos_fortes TEXT, requisitos_faltantes TEXT, eliminatorios_falhos TEXT, alertas TEXT, score_ia numeric CHECK 0..100, parecer_ia, timestamps/deleted_at.
Os campos narrados são TEXT, não arrays.
Não criar CRUD próprio.
Faça commit `feat(db): define ai evaluation table`.
```

## TASK-049 — Implementar persistência de idempotência

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Implemente no schema somente a solução aprovada pelo ADR-029 para idempotência. UNIQUE obrigatório, sem PII desnecessária.
Se a spec precisar extensão, atualize-a de forma explícita com referência ao ADR.
Lint/build.
Faça commit `feat(db): implement webhook idempotency persistence`.
```

## TASK-050 — Definir relations Drizzle

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Defina relações completas: Departamento->Cargo->Vaga, Candidato->filhos, Candidato/Vaga->Triagem, Triagem->AvaliacaoIA, cargo_interesse e area_interesse.
Confirme optionalidade e nomes.
Não duplicar relações.
Lint/build.
Faça commit `feat(db): define drizzle relations`.
```

## TASK-051 — Revisar schema completo

**Modelo recomendado:** Gemini 3.1 Pro

**Skill:** `drizzle-migration-check`

### Prompt para o Copilot Chat

```text
Faça review read-only primeiro comparando `src/server/db/schema.ts` com specs+ADRs.
Procure nullability, unique, enums, deleted_at, partial unique, checks, FKs, hard cascade, coluna não justificada.
Corrija somente desvios objetivos.
Lint/build.
Commit apenas se houver correção.
```

## TASK-052 — Gerar migration inicial

**Modelo recomendado:** Gemini 3.6 Flash

**Skill:** `drizzle-migration-check`

### Prompt para o Copilot Chat

```text
Execute `npm run db:generate` com nome claro.
Abra e revise o SQL gerado contra schema/spec. Confirme FKs, uniques, partial unique, checks e deleted_at.
Se estiver errado, corrija schema e regenere corretamente; não editar snapshot para mascarar.
Faça commit `feat(db): generate initial database migration`.
```

## TASK-053 — Aplicar migration em banco vazio

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Use banco/volume comprovadamente descartável.
Suba Postgres, execute db:migrate, db:smoke, liste tabelas/constraints e confirme log de migrations.
Nunca use push.
Registre resultado no DEVLOG.
Commit somente se houver correção/documentação.
```

## TASK-054 — Criar seed completo

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie seed Drizzle com dados fictícios cobrindo todos os domínios, triagens em estados diferentes e AvaliacaoIA presente/ausente.
Não usar PII real.
Adicione `npm run db:seed` e execute.
Faça commit `test(db): add domain development seed`.
```

# Fase 6 — Validação Zod

## TASK-055 — Criar schemas utilitários Zod

**Modelo recomendado:** Gemini 3.6 Flash

**Skill:** `zod-validation-utilities`

### Prompt para o Copilot Chat

```text
Crie `src/lib/validation/common.ts` com somente primitives reutilizadas: UUID, strings trimmed, UF, datas e coerções realmente necessárias.
Use Zod v4 e mensagens pt-BR quando forem para usuário.
Evite helper que esconda nullability.
Crie testes.
Faça commit `feat(validation): add common zod schemas`.
```

## TASK-056 — Criar validação Departamento

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie `src/lib/validation/departamento.ts` com schemas create/update. Não aceite id/timestamps/deletedAt do formulário.
Teste sucesso e erros.
Faça commit `feat(validation): add department schemas`.
```

## TASK-057 — Criar validação Cargo

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie `src/lib/validation/cargo.ts` conforme schema real, incluindo departamento_id, título, textos, ativo/faixa quando aplicável.
Testes.
Faça commit `feat(validation): add role schemas`.
```

## TASK-058 — Criar validação Vaga

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie `src/lib/validation/vaga.ts`: status, posições >0, cargo_id, remuneração, cidade e UF.
Use coerção somente no boundary necessário.
Testes.
Faça commit `feat(validation): add job schemas`.
```

## TASK-059 — Criar validação Candidato e filhos

**Modelo recomendado:** Gemini 3.1 Pro

**Skill:** `zod-validation-utilities`

### Prompt para o Copilot Chat

```text
Crie schemas para Candidato, Formação, Experiência e Certificação.
Email/celular obrigatórios, datas, enums, URLs e filhos tipados.
Exporte z.input/z.output quando transformação alterar shape.
Crie schema composto para o formulário agregado se isso reduzir duplicação sem acoplar banco.
Testes abrangentes.
Faça commit `feat(validation): add candidate schemas`.
```

## TASK-060 — Criar validação Triagem etapa/resultado/motivo

**Modelo recomendado:** Gemini 3.1 Pro

**Skill:** `zod-validation-utilities`

### Prompt para o Copilot Chat

```text
Crie `src/lib/validation/triagem.ts`.
Use `superRefine` para:
- motivo obrigatório em reprovado/desistente;
- motivo de reprovação apenas no subconjunto correto;
- motivo de desistência apenas no subconjunto correto;
- motivo null nos demais resultados.
Inclua etapa, resultado, parecer RH.
Teste todas as combinações importantes.
Faça commit `feat(validation): enforce screening state invariants`.
```

## TASK-061 — Criar validação do webhook n8n

**Modelo recomendado:** Gemini 3.1 Pro

**Skill:** `zod-validation-utilities`

### Prompt para o Copilot Chat

```text
Crie `src/lib/validation/n8n-webhook.ts` usando `docs/N8N_WEBHOOK_CONTRACT.md`.
Payload estrito: candidato, filhos, vaga/referência, triagem, avaliação IA, arquivo/metadados e dados de idempotência definidos.
External input é untrusted; use safeParse no handler depois.
Teste payload válido e inválidos.
Faça commit `feat(validation): add n8n webhook schema`.
```

# Fase 7 — Storage de currículos

## TASK-062 — Criar StorageProvider

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `src/lib/storage/storage.ts` com interface mínima para save, read/stream conforme necessidade, delete e referência de acesso.
Chaves são geradas pela aplicação, não paths arbitrários do usuário.
Não acoplar fs à interface.
Documente invariantes.
Faça commit `feat(storage): define storage provider`.
```

## TASK-063 — Implementar LocalStorageProvider

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `src/lib/storage/local-storage-provider.ts`.
Use STORAGE_ROOT, mkdir seguro, keys controladas pela aplicação, prevenção de path traversal, arquivos fora public, erro claro e nenhum log de conteúdo.
Teste com diretório temporário e cleanup do teste.
Faça commit `feat(storage): add local storage provider`.
```

## TASK-064 — Criar Route Handler de arquivos

**Modelo recomendado:** Gemini 3.1 Pro

**Skill:** `nextjs-app-router-patterns`

### Prompt para o Copilot Chat

```text
Crie `src/app/api/files/[...path]/route.ts` apenas para leitura/stream.
Use StorageProvider; valide path; 404 para ausente; headers seguros; não revele root físico; sem upload aqui.
Estruture para auth futura, mas não implemente auth.
Teste helpers/handler.
Faça commit `feat(storage): stream resume files through route handler`.
```

# Fase 8 — Referências visuais, design system e shell

## TASK-065 — Analisar referências visuais e criar mapa de UI

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `impeccable`, `shadcn`, `tailwind-design-system`, `building-components`, `vercel-composition-patterns`

### Prompt para o Copilot Chat

```text
Execute esta tarefa antes de implementar qualquer tela definitiva do WGOTalent.

Objetivo: analisar detalhadamente todas as referências visuais/layout fornecidas ao projeto e transformá-las em uma especificação visual reutilizável e econômica em contexto.

REGRAS:
- não implementar páginas nesta TASK;
- não copiar cegamente HTML/CSS das referências;
- não inventar segunda linguagem visual;
- specs e ADRs vencem qualquer screenshot;
- referências orientam aparência, composição, hierarchy, density e responsividade;
- shadcn + Tailwind + tokens WGOTalent continuam sendo a implementação técnica;
- se a referência conflitar com acessibilidade ou requisito funcional, preserve o requisito e documente a adaptação.

1. Localize a pasta de referências visuais/layout no repositório.
2. Se ela ainda não estiver em `docs/references/ui/`, mova-a para esse caminho, preservando os arquivos úteis.
3. Não mantenha cópia antiga depois da mudança.
4. Inventarie todos os arquivos encontrados e classifique por nome, formato, tela/domínio, desktop/mobile, completa/parcial e relevância para o MVP.
5. Identifique e remova somente referências comprovadamente duplicadas, temporárias ou fora do escopo. Antes de remover, confirme que outra referência preserva a informação necessária.
6. Analise cada referência relevante observando app shell/sidebar/header, largura/contenção, grid, cards, tabelas, formulários, filtros/busca, tabs/painéis, empty/loading/error, badges/status, hierarchy, spacing, tipografia, bordas/radius/shadows, densidade, cores e responsividade.
7. Consolide padrões repetidos. Só crie conceitos realmente recorrentes, como ApplicationShell, PageHeader, MetricCard, DataTable, FilterBar, EntityForm, EntityDetail, StatusBadge, EmptyState e DetailSection.
8. Para cada padrão, registre quais componentes shadcn podem ser reaproveitados e quando um componente WGOTalent específico é realmente necessário.
9. Não instale novos componentes shadcn nesta TASK.

Crie `docs/UI_REFERENCE_ANALYSIS.md` com:
- Referências analisadas;
- Linguagem visual observada;
- Layout estrutural;
- Padrões recorrentes;
- Mapa referência -> tela WGOTalent;
- Regras de consistência;
- Divergências/adaptações.

No mapa, cubra quando houver referência:
- Dashboard;
- Departamentos;
- Cargos;
- Vagas;
- Candidatos/listagem;
- Candidato/detalhe;
- Triagens/pipeline;
- Triagem/detalhe;
- formulários.

Crie também `docs/UI_REFERENCE_MAP.md`, curto, para contexto rápido:
- superfície;
- arquivos de referência a abrir;
- padrão visual;
- componentes principais;
- observações/adaptações.

Esse mapa será usado pelas próximas TASKs para evitar carregar toda a pasta de referências.

Atualize `docs/PROJECT_STATE.md` indicando:
- `docs/references/ui/` = fonte visual;
- `docs/UI_REFERENCE_ANALYSIS.md` = análise completa;
- `docs/UI_REFERENCE_MAP.md` = índice operacional;
- `docs/DESIGN.md` será a especificação final derivada desses materiais.

Não replique imagens em outras pastas.
Não criar componentes React.
Não alterar páginas.
Não instalar dependências.

Faça busca final por pasta antiga de referências, cópias duplicadas, arquivos temporários e referências fora de escopo.
Execute `git diff --check` e `git status --short`.
Faça commit local `docs(ui): analyze layout references`.
Não faça push.

Critério de aceitação:
- referências relevantes inventariadas;
- uma única pasta canônica `docs/references/ui/`;
- duplicatas desnecessárias removidas;
- análise visual documentada;
- mapa referência -> superfície criado;
- futuras TASKs conseguem abrir apenas 1-3 referências pertinentes em vez de reinterpretar toda a pasta.
```


## TASK-066 — Criar DESIGN.md

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `impeccable`, `tailwind-design-system`, `shadcn`, `building-components`

### Prompt para o Copilot Chat

```text
O produto é greenfield visual.

Antes de definir o Design System, leia obrigatoriamente:
- `docs/PRODUCT.md`;
- `docs/ARCHITECTURE.md`;
- `docs/UI_REFERENCE_ANALYSIS.md`;
- `docs/UI_REFERENCE_MAP.md`;
- `docs/specs/hr-platform-nextjs-architecture-prompt.md`.

Use o fluxo de new-work/init da skill impeccable quando aplicável.
As referências visuais são a principal direção de composição/aparência, mas não substituem specs/ADRs funcionais. Não redesenhe o produto do zero.

Transforme os padrões consolidados das referências em `docs/DESIGN.md`, definindo personalidade visual WGOTalent, tokens semânticos, tipografia, density, app shell/layout, tabelas, forms, badges, empty/loading/error, acessibilidade, mobile/responsive e componentes/padrões compartilhados.

Quando adaptar uma referência por acessibilidade, responsividade, shadcn ou funcionalidade real, registre a adaptação.
Não implementar telas de domínio nesta TASK.
Não duplicar a análise completa das referências: DESIGN.md deve ser a regra final, enquanto `UI_REFERENCE_ANALYSIS.md` mantém a evidência detalhada.
Faça commit `docs(ui): define wgo talent design system`.
```

## TASK-067 — Implementar tokens no globals.css

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `tailwind-design-system`, `tailwind-css-patterns`, `shadcn`

### Prompt para o Copilot Chat

```text
Leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`.
Atualize `src/styles/globals.css` para refletir DESIGN.md e a versão Tailwind/shadcn instalada.
Use tokens semânticos e OKLCH quando compatível.
Remova tokens/defaults substituídos e não usados.
Não estilize páginas de domínio.
Lint/build.
Faça commit `style(ui): implement wgo design tokens`.
```

## TASK-068 — Criar app shell RH

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `impeccable`, `shadcn`, `building-components`, `vercel-composition-patterns`, `react-best-practices`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie `src/app/(rh)/layout.tsx` com shell, header e navegação para Dashboard, Departamentos, Cargos, Vagas, Candidatos e Triagens.
Mobile navigation, estado ativo e acessibilidade.
Sem auth.
Use shadcn e tokens do projeto.
Não criar páginas CRUD além de placeholders mínimos necessários.
Remova layout alternativo substituído.
Lint/build.
Faça commit `feat(ui): add hr application shell`.
```

## TASK-069 — Criar componentes compartilhados mínimos

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `shadcn`, `building-components`, `vercel-composition-patterns`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie somente componentes que serão usados em vários domínios: PageHeader, DataEmptyState, FormSubmitButton, badges de status e callout de erro se necessário.
Use componentes shadcn existentes; evite wrapper que apenas renomeia prop.
Não criar Table genérica gigantesca.
Lint/build.
Faça commit `feat(ui): add shared application components`.
```

# Fase 9 — Departamento

## TASK-070 — Criar queries Departamento

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie `src/server/db/queries/departamentos.ts` com funções mínimas para list active, get active by id e verificar Cargos ativos antes do delete.
Use notDeleted.
Sem repository genérico.
Faça commit `feat(departments): add database queries`.
```

## TASK-071 — Criar Server Actions Departamento

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `src/actions/departamentos.ts` com create/update/soft-delete.
Zod no servidor, typed result, revalidatePath, zero hard delete.
Bloqueie delete se houver Cargo ativo conforme ADR.
Teste lógica/integração.
Faça commit `feat(departments): add server actions`.
```

## TASK-072 — Criar form Departamento

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `tanstack-form`, `zod-validation-utilities`, `shadcn`, `building-components`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie um único form reutilizável para create/edit usando TanStack Form + Zod Standard Schema conforme a versão instalada + shadcn Field/FieldGroup.
DefaultValues tipados, onBlur, erros acessíveis, pending e Server Action como mutation boundary.
Não duplicar schema client/server.
Lint/build/test.
Faça commit `feat(departments): add typed department form`.
```

## TASK-073 — Criar listagem Departamento

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `nextjs-app-router-patterns`, `shadcn`, `impeccable`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie `src/app/(rh)/departamentos/page.tsx` como Server Component.
Tabela/cards responsivos, empty state, links para criar/detalhar/editar e ação de delete apropriada.
Sem client fetch e sem API interna.
Faça commit `feat(departments): add department list page`.
```

## TASK-074 — Completar create/detail/edit Departamento

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Implemente páginas necessárias de criação/detalhe/edição usando Server Components e o mesmo form.
Trate notFound.
Remova qualquer placeholder substituído.
Não criar Route Handler de CRUD.
Lint/build.
Faça commit `feat(departments): complete department crud pages`.
```

## TASK-075 — Validar e limpar Departamento

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `task-closeout`, `repository-cleanliness-check`

### Prompt para o Copilot Chat

```text
Revise o domínio Departamento, execute tests/lint/build/smoke, valide bloqueio de delete e rode repository-cleanliness-check.
Confirme zero API CRUD, zero form duplicado e zero arquivo órfão.
Corrija somente achados do domínio.
Registre DEVLOG.
Commit apenas se houver mudança.
```

# Fase 10 — Cargo

## TASK-076 — Criar queries Cargo

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie queries Cargo com Departamento: list active, detail, options de Departamentos ativos e check de Vagas ativas para delete. notDeleted e sem N+1.
Faça commit `feat(roles): add role queries`.
```

## TASK-077 — Criar Server Actions Cargo

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Create/update/soft-delete Cargo. Valide Departamento ativo. Bloqueie delete com Vaga ativa conforme ADR. Zod, typed result, revalidatePath, zero API.
Testes.
Faça commit `feat(roles): add role server actions`.
```

## TASK-078 — Criar form Cargo

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `tanstack-form`, `zod-validation-utilities`, `shadcn`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie form único create/edit com Select de Departamento recebido do Server Component, campos conforme schema e validação TanStack+Zod.
Sem fetch client para options.
Faça commit `feat(roles): add typed role form`.
```

## TASK-079 — Criar páginas Cargo

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `nextjs-app-router-patterns`, `shadcn`, `impeccable`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Implemente list/create/detail/edit Cargo usando Server Components e design WGOTalent.
Use o mesmo form, soft delete e joins com Departamento.
Remova placeholders/componentes substituídos.
Lint/build.
Faça commit `feat(roles): complete role crud`.
```

## TASK-080 — Validar e limpar Cargo

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `task-closeout`, `repository-cleanliness-check`

### Prompt para o Copilot Chat

```text
Teste CRUD, FK e bloqueio de delete. Lint/build/test e limpeza de arquivos/imports/components.
Confirme nenhuma API interna.
Registre DEVLOG. Commit somente se necessário.
```

# Fase 11 — Vaga

## TASK-081 — Criar queries Vaga

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie queries Vaga: list active com Cargo+Departamento, detail e options de Cargos ativos.
Use notDeleted em listas/options e preserve capacidade de histórico quando necessária.
Faça commit `feat(jobs): add job queries`.
```

## TASK-082 — Criar Server Actions Vaga

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Create/update/soft-delete Vaga. Valide Cargo ativo. Soft delete não apaga Triagens históricas. Zod, typed result, revalidatePath.
Testes.
Faça commit `feat(jobs): add job server actions`.
```

## TASK-083 — Criar form Vaga

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `tanstack-form`, `zod-validation-utilities`, `shadcn`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie form único create/edit com status, posições, Cargo, remuneração, cidade e UF. Options server-fetched, errors/pending acessíveis.
Faça commit `feat(jobs): add typed job form`.
```

## TASK-084 — Criar páginas Vaga

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `nextjs-app-router-patterns`, `shadcn`, `impeccable`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Implemente list/create/detail/edit Vaga. Server Components, visual WGOTalent, Cargo/Departamento e soft delete.
Sem API interna. Remova placeholder substituído.
Lint/build.
Faça commit `feat(jobs): complete job crud`.
```

## TASK-085 — Validar e limpar Vaga

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `task-closeout`, `repository-cleanliness-check`

### Prompt para o Copilot Chat

```text
Teste CRUD, status, constraints e soft delete; confirme Triagens históricas preservadas. Lint/build/test e limpeza do domínio.
Registre DEVLOG. Commit só se houver correção.
```

# Fase 12 — Candidato

## TASK-086 — Criar queries Candidato agregadas

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `src/server/db/queries/candidatos.ts` com:
- list active resumida;
- detail ativo;
- detail completo com formacoes/experiencias/certificacoes/triagens;
- options ativos de Cargo/Departamento;
- lookup por email incluindo deleted para o webhook futuro.

Evite N+1 e não carregue currículo/texto bruto em listas.
Faça commit `feat(candidates): add normalized candidate queries`.
```

## TASK-087 — Criar formulário base Candidato

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `tanstack-form`, `zod-validation-utilities`, `shadcn`, `vercel-composition-patterns`, `building-components`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie o formulário base de Candidato com TanStack Form + Zod + shadcn.
Inclua dados pessoais, contato, endereço, preferências, disponibilidades e URLs.
Email e celular são obrigatórios.
Divida em seções compostas, evitando mega componente.
Não incluir arrays filhos ainda.
Faça commit `feat(candidates): add candidate base form`.
```

## TASK-088 — Adicionar Formações ao formulário

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `tanstack-form`, `zod-validation-utilities`, `shadcn`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Adicione `formacoes` ao mesmo formulário usando a API de array da versão instalada do TanStack Form.
Adicionar/remover itens, campos conforme spec, validação e acessibilidade.
Não duplicar estado fora do TanStack Form.
Faça commit `feat(candidates): add education form array`.
```

## TASK-089 — Adicionar Experiências ao formulário

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Adicione `experiencias` como array tipado ao formulário existente. `data_saida` nullable significa experiência atual. Não persistir duração derivada.
Validação e acessibilidade.
Faça commit `feat(candidates): add experience form array`.
```

## TASK-090 — Adicionar Certificações ao formulário

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Adicione `certificacoes` como array tipado ao mesmo formulário, seguindo a spec e Zod.
Não criar segundo form/state paralelo.
Faça commit `feat(candidates): add certification form array`.
```

## TASK-091 — Criar Server Action de criação Candidato

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie Candidato + filhos em uma única transaction Drizzle.
Valide Zod no servidor, email unique, referências ativas de cargo/área, filhos e typed result. Rollback completo em falha e revalidatePath.
Sem API Route.
Testes de integração.
Faça commit `feat(candidates): create candidate aggregate transaction`.
```

## TASK-092 — Criar Server Action de atualização Candidato

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Atualize Candidato + filhos em transaction.
Reconcilie arrays: update existentes, insert novos e soft-delete itens removidos. Nunca hard delete.
Evite duplicação e valide todos os IDs pertencentes ao candidato.
Testes.
Faça commit `feat(candidates): update candidate aggregate`.
```

## TASK-093 — Implementar soft delete cascata do Candidato

**Modelo recomendado:** Gemini 3.1 Pro

**Skill:** `soft-delete-check`

### Prompt para o Copilot Chat

```text
Implemente `deleteCandidato` em uma transaction setando deletedAt em:
- Candidato;
- Formações;
- Experiências;
- Certificações;
- Triagens;
- AvaliacaoIA ligada às Triagens.

Não usar DELETE nem ON DELETE CASCADE como mecanismo de soft delete.
Idempotente quando já deletado.
Testes de integração obrigatórios e soft-delete-check.
Faça commit `feat(candidates): cascade candidate soft delete`.
```

## TASK-094 — Decidir/implementar upload manual de currículo

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Verifique PRODUCT/specs.
Se cadastro manual do MVP precisa aceitar currículo, integre file input ao fluxo e salve via StorageProvider, com tipo/tamanho, key e cleanup em falha. Ao substituir arquivo, só remova o antigo após o novo estar salvo e DB atualizado.
Se não for requisito, documente a decisão e não implemente.
Não criar endpoint REST de upload.
Commit somente se houver mudança válida.
```

## TASK-095 — Criar listagem Candidatos

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `nextjs-app-router-patterns`, `shadcn`, `impeccable`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie `src/app/(rh)/candidatos/page.tsx` Server Component com listagem responsiva, resumo útil sem PII excessiva, empty state e links de criação/detalhe.
Sem fetch client e sem API interna.
Faça commit `feat(candidates): add candidate list page`.
```

## TASK-096 — Criar detalhe Candidato completo

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `shadcn`, `vercel-composition-patterns`, `building-components`, `impeccable`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie detalhe Server Component exibindo candidato, contato, preferências, formações, experiências, certificações, Triagens e link seguro para currículo quando houver.
Não exibir PII/conteúdo bruto além do necessário.
Use componentes pequenos e compostos.
Faça commit `feat(candidates): add candidate detail page`.
```

## TASK-097 — Criar páginas create/edit Candidato

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Integre o formulário agregado às páginas create/edit com Server Actions e options server-fetched.
Não duplicar formulário. Trate notFound, pending e erros.
Remova placeholders substituídos.
Lint/build.
Faça commit `feat(candidates): complete candidate edit flows`.
```

## TASK-098 — Validar e limpar domínio Candidato

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `task-closeout`, `repository-cleanliness-check`, `soft-delete-check`, `react-best-practices`

### Prompt para o Copilot Chat

```text
Execute tests unit/integration, create/update/delete cascade, storage quando aplicável, lint/build e limpeza do domínio.
Confirme: zero hard delete, zero API CRUD, zero form duplicado, cascade correto, email/celular obrigatórios e nenhuma query listando deleted.
Registre DEVLOG. Commit apenas se houver correção.
```

# Fase 13 — Triagem e AvaliacaoIA

## TASK-099 — Criar queries pipeline de Triagem

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `src/server/db/queries/triagens.ts` com list active + joins Candidato/Vaga/Cargo/AvaliacaoIA, filtros por etapa/resultado/motivo e detail.
Crie options ativos para formulário manual.
Use notDeleted para itens ativos, mas respeite ADR para referências históricas soft-deleted.
Sem N+1.
Faça commit `feat(screenings): add pipeline queries`.
```

## TASK-100 — Criar Server Actions Triagem

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie create/update/soft-delete Triagem manual.
Zod server-side, partial unique com erro de domínio, etapa/resultado/motivo, parecer RH/data, Candidato/Vaga ativos na criação, typed result e revalidatePath.
Não editar AvaliacaoIA manualmente por essas actions.
Testes.
Faça commit `feat(screenings): add screening server actions`.
```

## TASK-101 — Criar form Triagem

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `tanstack-form`, `zod-validation-utilities`, `shadcn`, `building-components`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie form TanStack+Zod:
- etapa separada;
- resultado separado;
- motivo condicional ao resultado e limitado ao subconjunto correto;
- parecer RH;
- Candidato/Vaga selects em criação.

Zod server continua autoridade. Use shadcn FieldGroup e acessibilidade.
Faça commit `feat(screenings): add typed screening form`.
```

## TASK-102 — Criar pipeline/listagem Triagens

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `nextjs-app-router-patterns`, `impeccable`, `shadcn`, `react-best-practices`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie `src/app/(rh)/triagens/page.tsx` como Server Component filterable por etapa/resultado/motivo usando query params server-side.
Visual claro de pipeline/lista, empty/loading adequados e sem client data fetching.
Não criar página `/avaliacoes`.
Faça commit `feat(screenings): add screening pipeline`.
```

## TASK-103 — Criar detalhe Triagem com AvaliacaoIA inline

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `shadcn`, `impeccable`, `building-components`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Crie `src/app/(rh)/triagens/[id]/page.tsx` exibindo Candidato, Vaga/Cargo, etapa/resultado/motivo, parecer RH e AvaliacaoIA inline quando existir.
Os campos `pontos_fortes`, `requisitos_faltantes`, `eliminatorios_falhos` e `alertas` são TEXT; apresente texto de forma legível, não como arrays inventados.
Sem CRUD separado da avaliação.
Faça commit `feat(screenings): add detail with ai evaluation`.
```

## TASK-104 — Criar páginas create/edit Triagem

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Integre form/actions em create/edit, com options server-fetched, notFound, pending e erros.
Sem API CRUD e sem rota Avaliações.
Remova placeholder substituído.
Lint/build.
Faça commit `feat(screenings): complete screening crud`.
```

## TASK-105 — Validar e limpar Triagem

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `task-closeout`, `repository-cleanliness-check`

### Prompt para o Copilot Chat

```text
Teste create, partial unique, combinações etapa/resultado/motivo, soft delete, filtros e detalhe com/sem IA.
Lint/build e repository cleanup.
Confirme ausência de CRUD AvaliacaoIA separado.
Registre DEVLOG. Commit só se houver correção.
```

# Fase 14 — Webhook n8n

## TASK-106 — Criar autenticação do webhook

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie helper server-only para validar o shared secret definido no contrato (header configurado, ex. x-webhook-secret).
Use env, comparação segura apropriada e erro sem revelar segredo.
Não criar rota completa ainda.
Testes.
Faça commit `feat(webhook): add shared secret authentication`.
```

## TASK-107 — Criar boundary do Route Handler n8n

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `nextjs-app-router-patterns`, `zod-validation-utilities`

### Prompt para o Copilot Chat

```text
Crie `src/app/api/webhooks/n8n/triagem/route.ts` com POST, auth, parse JSON, safeParse Zod e respostas de validação.
Ainda não persistir.
Sem stack trace/payload completo em log.
Testes do boundary.
Faça commit `feat(webhook): add validated n8n route boundary`.
```

## TASK-108 — Implementar idempotência

**Modelo recomendado:** Gemini 3.1 Pro

**Skill:** `webhook-contract-check`

### Prompt para o Copilot Chat

```text
Implemente exatamente o ADR de idempotência: receber key, proteger contra retry/concorrência e retornar resposta consistente sem criar duplicatas.
Integre a persistência aprovada sem consumir a key de modo que quebre retry após transaction falhar.
Testes.
Faça commit `feat(webhook): enforce idempotent processing`.
```

## TASK-109 — Persistir/upsert Candidato pelo webhook

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Implemente service/helper do webhook após payload validado:
- lookup email incluindo deleted;
- candidato ativo: update campos aprovados;
- deleted: comportamento do ADR, sem reativação silenciosa;
- novo: insert;
- sincronizar formações/experiências/certificações sem hard delete.

Testes de integração.
Faça commit `feat(webhook): persist normalized candidate payload`.
```

## TASK-110 — Persistir currículo do webhook

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Integre o arquivo definido no contrato ao StorageProvider.
Valide tipo/tamanho, salve com key segura, grave key no candidato e faça cleanup do arquivo se DB falhar.
Nunca public/, nunca confiar em filename e nunca logar conteúdo.
Testes com temp storage.
Faça commit `feat(webhook): store inbound resume safely`.
```

## TASK-111 — Persistir Triagem + AvaliacaoIA em transaction

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `webhook-contract-check`, `drizzle-migration-check`

### Prompt para o Copilot Chat

```text
Implemente a transaction principal: resolver Vaga, criar Triagem respeitando partial unique, criar/upsert AvaliacaoIA 1:1, gravar campos TEXT exatamente conforme spec e finalizar estado de idempotência conforme ADR.
Rollback completo em erro.
n8n não escreve DB.
Testes de integração.
Faça commit `feat(webhook): persist screening and ai evaluation transaction`.
```

## TASK-112 — Completar respostas e revalidation do webhook

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Finalize Route Handler com 2xx, retry idempotente, conflito candidato deleted, validation error, domain conflict e internal error genérico.
Revalide caminhos de candidatos/triagens necessários.
Não expor payload interno.
Testes.
Faça commit `feat(webhook): complete n8n webhook responses`.
```

## TASK-113 — Documentar webhook com exemplo sanitizado

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Atualize `docs/N8N_WEBHOOK_CONTRACT.md` com request fictício, headers, respostas, retry, idempotência e orientação para o n8n.
Nenhum segredo real e nenhum workflow n8n inventado.
Crie fixture JSON fictícia apenas se usada em testes.
Faça commit `docs(webhook): document n8n integration`.
```

## TASK-114 — Smoke test ponta a ponta do webhook

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `webhook-contract-check`, `soft-delete-check`, `task-closeout`

### Prompt para o Copilot Chat

```text
Com DB local e dados fictícios:
1. envie payload válido;
2. confirme candidato+filhos;
3. confirme arquivo;
4. confirme Triagem;
5. confirme AvaliacaoIA;
6. repita mesma idempotency key e confirme zero duplicata;
7. teste candidato deleted;
8. rode checks de integridade/soft delete.

Registre DEVLOG. Corrija somente bugs. Commit só se houver mudança.
```

# Fase 15 — Dashboard

## TASK-115 — Criar queries Dashboard

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie queries pequenas para vagas abertas, candidatos ativos, triagens por etapa/resultado, média de score IA quando aplicável e atividade recente.
Defina semanticamente cada métrica, use notDeleted e evite overfetch.
Faça commit `feat(dashboard): add summary queries`.
```

## TASK-116 — Criar Dashboard WGOTalent

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `impeccable`, `shadcn`, `tailwind-design-system`, `react-best-practices`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Antes de implementar:
1. leia a entrada `Dashboard` em `docs/UI_REFERENCE_MAP.md`;
2. abra somente as referências visuais mapeadas para Dashboard;
3. preserve App Shell, tokens e componentes compartilhados já implementados.

Crie Dashboard como Server Component no grupo RH usando as queries aprovadas.
Use cards/tabelas/resumos úteis e design WGOTalent. Não instalar chart library nova só por estética.
Responsivo e acessível.
Remova home/placeholder substituído.
Faça commit `feat(dashboard): add wgo talent overview`.
```

# Fase 16 — Auditorias do produto

## TASK-117 — Auditoria visual com Impeccable

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `impeccable`, `shadcn`, `tailwind-css-patterns`, `building-components`

### Prompt para o Copilot Chat

```text
Antes de implementar a superfície:
1. leia `docs/DESIGN.md` e `docs/UI_REFERENCE_MAP.md`;
2. localize a entrada correspondente à superfície atual;
3. abra somente as referências apontadas pelo mapa; se não houver referência específica, siga DESIGN.md;
4. não reanalise toda `docs/references/ui/`;
5. referências orientam layout/aparência, mas não podem adicionar campos ou comportamento fora das specs/ADRs;
6. reutilize padrões/componentes já implementados antes de criar novos.

Audite todas as superfícies usando Impeccable e seus limites de passes.
Revise hierarchy, spacing, tokens, accessibility, responsive, empty/loading/error e consistência.
Faça uma rodada de correções em lote e no máximo a confirmação adicional prevista pela skill.
Não adicionar feature. Remova estilos/componentes substituídos.
Lint/build.
Faça commit `style(ui): run product-wide design audit`.
```

## TASK-118 — Auditoria React/Next performance

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `react-best-practices`, `nextjs-app-router-patterns`

### Prompt para o Copilot Chat

```text
Revise waterfalls, client boundaries, serialização, overfetch, rerenders, imports, bundle, Suspense e paralelismo de queries.
Corrija somente problemas concretos; não adicionar abstraction por moda.
Ao substituir abordagem, remova a anterior.
Lint/build.
Faça commit `perf: apply react next performance review` se houver mudanças.
```

## TASK-119 — Auditoria de formulários

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `tanstack-form`, `zod-validation-utilities`, `shadcn`

### Prompt para o Copilot Chat

```text
Revise todos os forms: onBlur, touched, errors, subscriptions, schemas duplicados, invariantes client/server, pending, disabled, arrays e acessibilidade.
Confirme TanStack Form como único form state library e Zod no boundary server.
Remova helper/form alternativo sem uso.
Tests/lint/build.
Faça commit `refactor(forms): standardize form patterns` se houver mudanças.
```

## TASK-120 — Auditoria global de soft delete

**Modelo recomendado:** Gemini 3.1 Pro

**Skill:** `soft-delete-check`

### Prompt para o Copilot Chat

```text
Inspecione todas as queries/actions.
Confirme deleted_at em todas as entidades canônicas, notDeleted em reads normais, históricos tratados conscientemente, zero DELETE na app, cascade do candidato, uniques e semântica de dependências organizacionais.
Crie testes faltantes e corrija desvios.
Faça commit `fix(db): enforce soft delete invariants` se necessário.
```

# Fase 17 — Limpeza e documentação final

## TASK-121 — Remover shadcn/dependências não usados

**Modelo recomendado:** Gemini 3.6 Flash

**Skills:** `repository-cleanliness-check`, `shadcn`

### Prompt para o Copilot Chat

```text
Liste `src/components/ui`, pesquise imports e remova componentes shadcn sem uso.
Audite dependências diretas do package.json e remova somente as comprovadamente órfãs.
Atualize lockfile.
Não remover dependência transitiva necessária.
Execute test/lint/build e repository-cleanliness-check.
Faça commit `chore: remove unused ui components and dependencies`.
```

## TASK-122 — Inventariar todos os arquivos versionados

**Modelo recomendado:** Gemini 3.1 Pro

**Skill:** `repository-cleanliness-check`

### Prompt para o Copilot Chat

```text
Audite o repositório inteiro e classifique cada arquivo/diretório relevante como produto, harness, spec/ADR/doc atual, migration, teste/fixture, configuração necessária ou órfão/duplicado/boilerplate.

Remova tudo comprovadamente fora do escopo: assets sem uso, docs duplicados, placeholders, scripts superseded, componentes alternativos e fontes de verdade duplicadas.
Preserve specs e ADR histórico válido.
Execute git diff --check, test/lint/build.
Faça commit `chore: enforce repository scope cleanliness`.
```

## TASK-123 — Criar quality gates npm

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Normalize scripts npm: lint, build, test, test:run, db:generate, db:migrate, db:seed, db:smoke, `check` (lint+tests rápidos+build) e `check:integration` para DB.
Não duplicar scripts equivalentes.
Documente brevemente.
Execute check.
Faça commit `chore: add reproducible quality gates`.
```

## TASK-124 — Criar README operacional final

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Reescreva README com produto, stack, requisitos, .env, Postgres Docker, npm install, migrate, seed, dev, webhook, storage, tests, harness/skills, estrutura e fora de escopo.
Não duplicar DATA MODEL/spec.
Teste comandos quando seguros.
Faça commit `docs: add reproducible project readme`.
```

## TASK-125 — Criar SECURITY.md

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Crie `docs/SECURITY.md` cobrindo webhook secret, PII, currículo, storage path, logs, env, ausência de auth no MVP, soft delete não é anonimização, dados fictícios e boundary n8n externo.
Pesquise segredos/dados reais no Git. Corrija exposição objetiva sem reescrever histórico automaticamente.
Faça commit `docs: document security and privacy posture`.
```

## TASK-126 — Criar TECHNICAL_WALKTHROUGH.md

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie material em português explicando por que o Create T3 App foi usado somente como scaffolder, App Router, Server Components, Server Actions, Drizzle/migrations, soft delete, TanStack Form, Zod, shadcn/Tailwind, StorageProvider, webhook n8n, idempotência, fluxo candidato->triagem->IA e harness/skills.
Inclua diagrama e não copie arquivos grandes.
Faça commit `docs: add technical walkthrough`.
```

## TASK-127 — Atualizar DEVLOG e prompts-log

**Modelo recomendado:** Gemini 3.6 Flash

### Prompt para o Copilot Chat

```text
Crie/atualize `docs/prompts-log/` registrando somente marcos: data, TASK, modelo quando conhecido, objetivo, resultado, falha/correção e ADR relevante.
Não copiar todos os prompts e não inventar tokens/tempo.
Atualize DEVLOG.
Faça commit `docs(harness): record greenfield development history`.
```

# Fase 18 — Validação e congelamento

## TASK-128 — Validação completa em banco vazio

**Modelo recomendado:** Gemini 3.1 Pro

**Skills:** `task-closeout`, `repository-cleanliness-check`, `drizzle-migration-check`, `webhook-contract-check`, `soft-delete-check`

### Prompt para o Copilot Chat

```text
Não adicione feature.

Execute:
1. npm ci;
2. npm run check;
3. docker compose config;
4. banco/volume de teste vazio;
5. db:migrate;
6. db:smoke;
7. db:seed;
8. check:integration;
9. smoke das páginas;
10. smoke webhook;
11. repository cleanliness;
12. git diff --check;
13. busca de segredos;
14. git status.

Crie `docs/FINAL_VALIDATION.md` com PASS/FAIL e comandos reais.
Corrija somente bloqueadores.
Faça commit `test: record final greenfield validation`.
```

## TASK-129 — Revisão final do harness

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Revise somente harness: instructions, agents, prompts, skills fornecidas, skills WGO, contexto e docs.
Simule quatro tarefas: alterar schema, criar form, alterar UI, alterar webhook. Confirme skill/contexto corretos, paths `src/` coerentes e nenhuma instrução que tente introduzir tRPC/Auth/Prisma ou tratar T3 como framework obrigatório.
Não alterar produto salvo referência documental incorreta.
Faça commit `chore(harness): final harness consistency review` se houver mudança.
```

## TASK-130 — Congelar marco greenfield v1

**Modelo recomendado:** Gemini 3.1 Pro

### Prompt para o Copilot Chat

```text
Feche o marco sem feature nova.

1. Leia FINAL_VALIDATION.
2. Confirme árvore limpa.
3. Crie `docs/RELEASE_SUMMARY.md` com escopo, arquitetura, schema, forms, UI, webhook, testes, harness e limitações.
4. Atualize PROJECT_STATE para MVP v1.
5. Rode `npm run check` final.
6. Commit `docs: close wgo talent greenfield mvp`.
7. Se gates essenciais passarem, crie tag local `wgo-greenfield-v1`.
8. Não push/release remoto.

Ao final mostre comandos de reprodução.
```

---

# Gates obrigatórios

- **Gate A — Harness:** TASK-001 a TASK-018.
- **Gate B — Scaffold limpo:** TASK-019 a TASK-026.
- **Gate C — Decisões:** TASK-027 a TASK-032.
- **Gate D — Banco/schema:** TASK-033 a TASK-054.
- **Gate E — Validação/storage:** TASK-055 a TASK-064.
- **Gate F — Referências visuais + Design system:** TASK-065 a TASK-069.
- **Gate G — CRUD principal:** TASK-070 a TASK-105.
- **Gate H — Webhook:** TASK-106 a TASK-114.
- **Gate I — Dashboard/auditorias:** TASK-115 a TASK-120.
- **Gate J — Limpeza/docs:** TASK-121 a TASK-127.
- **Gate K — Congelamento:** TASK-128 a TASK-130.

# Estrutura-alvo

```text
WGOTalent/
├── .claude/skills/
├── .github/
│   ├── copilot-instructions.md
│   ├── agents/
│   ├── instructions/
│   ├── prompts/
│   └── skills/
├── .vscode/settings.json
├── src/
│   ├── app/
│   │   ├── (rh)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── departamentos/
│   │   │   ├── cargos/
│   │   │   ├── vagas/
│   │   │   ├── candidatos/
│   │   │   └── triagens/
│   │   ├── api/
│   │   │   ├── files/[...path]/route.ts
│   │   │   └── webhooks/n8n/triagem/route.ts
│   │   └── layout.tsx
│   ├── actions/
│   │   ├── departamentos.ts
│   │   ├── cargos.ts
│   │   ├── vagas.ts
│   │   ├── candidatos.ts
│   │   └── triagens.ts
│   ├── components/
│   │   ├── ui/
│   │   └── ...
│   ├── lib/
│   │   ├── storage/
│   │   └── validation/
│   ├── server/
│   │   └── db/
│   │       ├── index.ts
│   │       ├── schema.ts
│   │       ├── query-helpers.ts
│   │       └── queries/
│   ├── styles/
│   │   └── globals.css
│   └── env.js
├── docs/
│   ├── specs/
│   ├── references/
│   │   └── ui/
│   ├── decisions/
│   ├── PRODUCT.md
│   ├── PROJECT_STATE.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── UI_REFERENCE_ANALYSIS.md
│   ├── UI_REFERENCE_MAP.md
│   ├── DEVELOPMENT_METHOD.md
│   ├── HARNESS.md
│   ├── N8N_WEBHOOK_CONTRACT.md
│   ├── SECURITY.md
│   └── TECHNICAL_WALKTHROUGH.md
├── drizzle/
├── infra/postgres/
├── scripts/
├── docker-compose.yml
├── drizzle.config.ts
├── components.json
├── package.json
└── README.md
```

Não criar diretórios vazios antecipadamente; eles surgem quando a TASK precisa deles. A organização `src/` vem do scaffold T3 mínimo e deve permanecer enquanto fizer sentido para o WGOTalent.

# Definition of Done global

Uma TASK só está concluída quando:

- escopo atendido;
- skill/documentação adequada consultada;
- nenhuma implementação antiga paralela;
- boilerplate do scaffolder removido quando não pertence ao produto;
- imports/exports/arquivos órfãos causados pela TASK removidos;
- dependência órfã causada pela TASK removida;
- testes relevantes passam;
- lint passa;
- build passa quando aplicável;
- migration revisada quando aplicável;
- sem segredo novo;
- `git diff --check` limpo;
- documentação afetada sincronizada;
- commit contém apenas a TASK;
- o resultado é compreensível sem depender do histórico do chat.

# Escopo negativo final

Ao final não devem existir:

```text
.bootstrap/
prisma/
schema.prisma
@prisma/client
@supabase/supabase-js
@trpc/*
tRPC routers/procedures
Auth.js/NextAuth no MVP
src/server/api/ (se existir apenas para tRPC)
start-database.sh
script db:push
NEXT_PUBLIC_SUPABASE_*
react-hook-form
@tanstack/zod-form-adapter (salvo necessidade comprovada da versão instalada)
API routes CRUD internas
src/app/avaliacoes/
hard DELETE em app layer
currículos em public/
n8n no docker-compose
DATABASE_URL disponível ao n8n
componentes shadcn sem uso
assets padrão do Next sem uso
boilerplate de tutorial
dois schemas concorrentes
dois sistemas de formulário
duas implementações da mesma tela
duas pastas concorrentes de referências visuais
referências visuais duplicadas/temporárias sem função
```
