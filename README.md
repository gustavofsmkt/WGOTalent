# WGOTalent

Plataforma de RH para gestão de departamentos, cargos, vagas, candidatos e
triagem de candidatos com apoio de um motor de agentes de IA nativo (screening
de currículos e avaliação de aderência). Next.js App Router de ponta a ponta —
sem servidor de API separado.

Para a visão de produto completa (problema, usuários, entidades, capacidades
do MVP), ver [docs/PRODUCT.md](docs/PRODUCT.md). Para o modelo de dados
canônico, ver [docs/db_triagem_proposta.ts](docs/db_triagem_proposta.ts) —
não duplicado aqui.

## Stack

- **Framework**: Next.js 15 (App Router) + React 19 + TypeScript
- **Banco de dados**: PostgreSQL, via driver `postgres`
- **ORM**: Drizzle ORM + Drizzle Kit (migrations schema-first)
- **Validação**: Zod + `@t3-oss/env-nextjs` (env), Zod (formulários/ações)
- **Formulários**: TanStack Form
- **UI**: Tailwind CSS 4 + shadcn/ui + lucide-react
- **IA**: `@google/genai` (Gemini via Google AI Studio) por trás de um motor
  de agentes próprio — ver [Motor de Agentes IA](#motor-de-agentes-ia)
- **E-mail**: `imapflow` (cliente IMAP) + `mailparser` (parsing MIME/anexos) —
  ver [Captação de Currículo via E-mail](#captação-de-currículo-via-e-mail)
- **Testes**: Vitest

Não usa tRPC, Auth.js/NextAuth ou Prisma (T3 App foi usado só como
scaffolder inicial).

## Requisitos

- Node.js 22.6+ (o script `db:seed` usa `--env-file` e
  `--experimental-strip-types`, nativos do Node — sem `ts-node`/`tsx`)
- Docker + Docker Compose (para o PostgreSQL local)
- npm (o projeto fixa `packageManager: npm@11.9.0` em [package.json](package.json))

## Configuração de ambiente (.env)

Variáveis validadas em [src/env.js](src/env.js) — nunca leia `process.env.*`
diretamente em código de servidor, sempre importe `env` de `~/env`.

1. Copie o template:

   ```bash
   cp .env.example .env
   ```

2. Preencha:

   | Variável | Descrição |
   |---|---|
   | `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` / `POSTGRES_PORT` | Credenciais usadas pelo `docker-compose.yml` para subir o Postgres local. |
   | `DATABASE_URL` | String de conexão do Postgres, consumida pelo Drizzle. Deve casar com as variáveis `POSTGRES_*` acima. |
   | `STORAGE_ROOT` | Caminho absoluto (ou relativo ao cwd) do diretório de armazenamento local de arquivos (currículos). |
   | `AGENT_CREDENTIALS_ENCRYPTION_KEY` | Chave mestra (mín. 32 chars) usada para cifrar/decifrar em repouso (AES-256-GCM) as credenciais de provedor de LLM **e** de e-mail (IMAP) cadastradas via admin. Gere uma vez com `openssl rand -base64 32` — **nunca rotacione sem um plano de re-cifragem** das credenciais já salvas (ver comentário em [.env.example](.env.example)). |
   | `EMAIL_CAPTURA_INTERVALO_MS` | Opcional (default `60000`). Intervalo em ms entre ciclos do loop de captação de currículo por e-mail — ver [Captação de Currículo via E-mail](#captação-de-currículo-via-e-mail). |

   Detalhes adicionais de cada variável: [docs/specs/environment.md](docs/specs/environment.md).

## Banco de dados (PostgreSQL via Docker)

O `docker-compose.yml` sobe um único serviço `postgres` (imagem
`postgres:16-alpine`) com a extensão `unaccent` habilitada via script de
init em `infra/postgres/init/001-unaccent.sql`.

```bash
docker compose up -d
```

Isso expõe o Postgres em `localhost:${POSTGRES_PORT}` (padrão `5432`) com um
volume nomeado (`postgres_data`) para persistência entre restarts.

## Instalação

```bash
npm install
```

Nenhuma dependência deve ser adicionada sem aprovação explícita (ver
[AGENTS.md](AGENTS.md)).

## Migrations

Schema-first: a fonte da verdade é [src/server/db/schema.ts](src/server/db/schema.ts).
Todas as tabelas são criadas com prefixo `wgotalent_` e seguem soft delete
universal (`deleted_at`, nunca `DELETE` físico).

```bash
npm run db:generate   # gera uma nova migration a partir de mudanças no schema.ts
npm run db:migrate    # aplica as migrations pendentes em DATABASE_URL
npm run db:studio     # abre o Drizzle Studio para inspecionar o banco
```

Migrations geradas ficam em [drizzle/](drizzle/) e são versionadas — não edite
uma migration já commitada, gere uma nova.

## Seed

```bash
npm run db:seed
```

Popula o banco com dados de exemplo (departamentos, cargos, vagas,
candidatos, triagens). **Atenção**: o script limpa as tabelas relevantes antes
de inserir (ordem reversa de dependência) — rodá-lo em um banco com dados que
você quer preservar os apaga. Seguro em ambiente local de desenvolvimento,
não use contra um banco compartilhado.

## Rodando em desenvolvimento

```bash
npm run dev
```

Sobe o Next.js em modo dev (Turbopack) em `http://localhost:3000`.

Outros scripts de execução:

```bash
npm run build     # build de produção
npm run start     # serve o build de produção
npm run preview   # build + start em sequência
```

## Storage

Arquivos (currículos) nunca são gravados em `public/`. Toda I/O de arquivo
passa pela interface `StorageProvider`
([src/lib/storage/storage.ts](src/lib/storage/storage.ts)), implementada para
o MVP como disco local
([src/lib/storage/local-storage-provider.ts](src/lib/storage/local-storage-provider.ts))
apontando para `STORAGE_ROOT`. Leitura é servida de forma controlada via
route handler em `src/app/api/files/[...path]/route.ts`. Chaves de arquivo são
geradas pela aplicação (nunca derivadas de input arbitrário do usuário), e
`delete()` é idempotente. Trocar para um provider de nuvem (S3/Blob) no futuro
não deve exigir mudanças fora de `src/lib/storage/`.

## Motor de Agentes IA

Triagem de IA (extração de currículo, classificação de aderência candidato↔vaga,
avaliação/triagem) é executada nativamente pela plataforma por um motor de
agentes configurável via admin, substituindo a orquestração externa via n8n
planejada originalmente — ver
[ADR-0007](docs/decisions/0007-encerramento-integracao-n8n.md).

- **Slots configuráveis** (modelo/provedor/system prompt/user prompt/parâmetros
  por slot, editáveis em `/admin/agentes/[slot]`):
  `extracao_curriculo`, `classificador_aderencia`, `avaliador_triagem`
  (ver enum em [src/server/db/schema.ts](src/server/db/schema.ts)).
- **Provedor implementado**: Gemini via Google AI Studio
  ([src/lib/agents/gemini-client.ts](src/lib/agents/gemini-client.ts)); o
  catálogo em [src/lib/agents/provider-catalog.ts](src/lib/agents/provider-catalog.ts)
  já lista outros provedores como opção de UI, mas eles só ficam disponíveis
  quando ganharem implementação real.
- **Credenciais de LLM** são cadastradas via `/admin/credenciais` e cifradas em
  repouso com `AGENT_CREDENTIALS_ENCRYPTION_KEY` (ver
  [src/lib/agents/crypto.ts](src/lib/agents/crypto.ts)).
- **Formatos de currículo suportados**: PDF, DOCX (via `mammoth`, sem serviço
  de conversão externo), PNG, JPEG.
- **Ingestão**: upload manual pelo recrutador (individual ou em lote, ver
  `src/app/(rh)/candidatos/upload-lote/`) ou captação automática por e-mail
  (ver [Captação de Currículo via E-mail](#captação-de-currículo-via-e-mail)).
- **Orquestração** (extração → classificação → avaliação) vive em
  [src/server/agents/orquestracao.ts](src/server/agents/orquestracao.ts), com
  concorrência limitada via `runWithLimit`
  ([src/lib/concurrency/run-with-limit.ts](src/lib/concurrency/run-with-limit.ts)).

## Captação de Currículo via E-mail

Além do upload manual, currículos podem ser captados automaticamente de uma
caixa de e-mail via **IMAP genérico** — cobre Zimbra, Google Workspace e M365
com IMAP habilitado, sem SDK proprietário por provedor (ver
[ADR-0010](docs/decisions/0010-captacao-curriculo-via-email.md)).

- **Aba admin "Captação de E-mail"** (`/admin`): cadastra host, porta,
  usuário, senha e pasta monitorada de uma única caixa por vez. A senha é
  cifrada em repouso com a mesma chave `AGENT_CREDENTIALS_ENCRYPTION_KEY` das
  credenciais de LLM (ver
  [src/lib/agents/crypto.ts](src/lib/agents/crypto.ts)) e nunca é reexibida;
  cadastrar uma nova credencial desativa a anterior automaticamente.
- **Loop interno** no processo Next.js, iniciado via `instrumentation.ts`
  (convenção oficial do Next.js) — não depende de cron externo. Intervalo
  configurável por `EMAIL_CAPTURA_INTERVALO_MS` (default 60s).
- **Idempotência via watermark de UID IMAP** (`ultimoUidProcessado`),
  monotônico e por-mailbox: cada ciclo busca só mensagens com UID maior que o
  último processado, e o watermark só avança até o que foi efetivamente
  coberto no ciclo — nunca além, nunca parcialmente.
- **Na primeira ativação**, o padrão é pular o histórico da caixa e capturar
  só o que chegar dali em diante (evita tratar anos de e-mail antigo como
  candidatura). Para colocar a captação em produção contra uma caixa que já
  recebe currículos há tempo, preencha "Capturar e-mails a partir de" (uma
  data) ao cadastrar a credencial — a captura passa a consumir o backlog a
  partir dessa data (o próprio `IMAP SEARCH SINCE` já filtra no servidor,
  nunca busca mensagem mais antiga) em lotes de até 20 mensagens por ciclo
  (não tudo de uma vez), o que mantém cada ciclo rápido e faz uma eventual
  interrupção no meio do backfill perder no máximo o lote em andamento, não
  o progresso todo.
- Anexos elegíveis (mesmos mimetypes/tamanho aceitos no upload manual: PDF,
  DOCX, PNG, JPEG, até 5MB) são extraídos com `imapflow` + `mailparser` e
  processados pelo mesmo pipeline do upload em lote
  ([src/server/candidatos/processar-curriculo-recebido.ts](src/server/candidatos/processar-curriculo-recebido.ts)),
  só mudando `origem` para `"email"`. Não há filtro de "isso parece um
  currículo" além do tipo/tamanho do arquivo — numa caixa dedicada de
  recrutamento isso não é problema, mas numa caixa pessoal de teste
  qualquer PDF que chegar (boleto, recibo) entra no pipeline de extração.
- **Cota de IA excedida não descarta o currículo**: se a extração falhar
  por limite de requisições do provedor (`AgenteQuotaExcedidaError`), o
  watermark não avança por cima dessa mensagem — ela fica pendente para
  nova tentativa num ciclo seguinte, em vez de ser perdida para sempre.
  Reage ao tipo de erro, não a números de RPM/RPD de um provedor
  específico, então funciona sem mudança quando outros provedores de IA
  além do Gemini forem adicionados.
- **Nota de teste**: contas Gmail exigem uma **Senha de App**
  (`myaccount.google.com/apppasswords`) em vez da senha normal desde 2022 —
  usado para validar a feature em desenvolvimento. Em produção (Zimbra), a
  senha normal da conta dedicada de captação funciona via IMAP sem essa
  exigência; não há nenhum código específico de provedor.

## Testes

```bash
npm test           # Vitest em modo watch
npm run test:run   # Vitest single-run (usado pelo gate `check`)
```

Vitest roda em ambiente Node, sem depender de um Postgres real (ver
[vitest.config.ts](vitest.config.ts)) — testes de repositório e ações usam
duplos/mocks em vez do banco. Suíte atual: 54 arquivos / 440 testes cobrindo
validação, repositórios, agentes de IA, storage, server actions, captação de
e-mail e páginas.

## Quality gates (npm scripts)

| Script | O que faz |
|---|---|
| `npm run lint` | ESLint (`next/core-web-vitals` + `next/typescript`) sobre todo o projeto. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Vitest em modo watch. |
| `npm run test:run` | Vitest single-run (usado por `check`). Não depende de Postgres real. |
| `npm run build` | Build de produção do Next.js. |
| `npm run db:generate` | Gera migrations do Drizzle a partir do schema. |
| `npm run db:migrate` | Aplica migrations pendentes no Postgres apontado por `DATABASE_URL`. |
| `npm run db:seed` | Popula o banco com dados de exemplo (limpa antes de inserir). |
| `npm run db:smoke` | Smoke test de conectividade (`SELECT 1`, extensão `unaccent`). |
| `npm run db:studio` | Abre o Drizzle Studio. |
| `npm run check` | Gate local: `lint && test:run && build`. Não precisa de Postgres rodando. |
| `npm run check:integration` | Gate de banco: `db:migrate && db:smoke`. Precisa de um Postgres real em `DATABASE_URL` (ver `docker-compose.yml`). |

`check` é o gate padrão antes de commit/PR. `check:integration` roda à parte
porque depende de infraestrutura externa (Postgres) que `check` não requer.

## Harness / Skills

Regras e convenções para agentes de IA que trabalham neste repositório vivem
em [AGENTS.md](AGENTS.md) (fonte de precedência, camadas de arquitetura,
invariantes, restrições de stack) e em
[docs/HARNESS.md](docs/HARNESS.md) (localização dos artefatos de IA, política
de skills, integrações MCP permitidas/proibidas, gerenciamento de contexto).

Skills técnicas e de governança vivem em `.agents/skills/` (canônico —
`.claude/skills/` e `.github/skills/` são symlinks para o mesmo diretório):
camadas do projeto (`layer-db`, `layer-validation`, `layer-storage`,
`layer-actions`, `layer-api`, `layer-ui`), padrões gerais (Drizzle, TanStack
Form, Zod, Next.js, React, shadcn, Tailwind) e governança
(`drizzle-migration-check`, `repository-cleanliness-check`,
`soft-delete-check`, `task-closeout`). Regra geral: carregue só a skill
mínima necessária para a tarefa atual — não carregue todas preventivamente.

## Estrutura do projeto

```
src/
  app/
    (rh)/              # páginas do RH: departamentos, cargos, vagas, candidatos, triagens, dashboard
    admin/              # configuração de agentes de IA e credenciais de LLM
    api/files/          # route handler que serve currículos do storage local
  actions/              # Server Actions — única fronteira de mutação interna
  components/           # componentes React (forms, tabelas, ui/ compartilhado)
  lib/
    agents/             # cliente Gemini, catálogo de provedores, cripto de credenciais, templates de prompt
    concurrency/        # utilitário de limite de concorrência
    email/              # cliente IMAP (imapflow + mailparser)
    storage/            # StorageProvider e implementação local
    validation/         # schemas Zod compartilhados entre actions e forms
  server/
    agents/             # pipeline de orquestração da IA (extração, classificação, avaliação)
    candidatos/         # processamento de currículo recebido, compartilhado entre upload em lote e captação por e-mail
    db/                 # schema Drizzle, client, query-helpers, repositórios, seed
    email/              # ciclo e loop de captação de currículo por e-mail
  env.js                # validação de env vars (@t3-oss/env-nextjs)
  instrumentation.ts    # bootstrap do loop de captação de e-mail (hook oficial do Next.js)
drizzle/                 # migrations SQL geradas + snapshots
docs/                    # produto, arquitetura, ADRs, specs, harness — memória do projeto
infra/postgres/init/     # scripts de init do Postgres (extensão unaccent)
storage/                  # arquivos armazenados localmente (gitignored)
```

## Fora de escopo (MVP)

- Autenticação, perfis de acesso e autorização — o sistema opera de forma
  aberta inicialmente.
- Integração nativa com storage em nuvem (S3/Azure Blob).
- UI complexa (modais avançados, rotas interceptadas/paralelas).
- Deleções físicas (hard delete) — tudo é soft delete via `deleted_at`.
- Escritas diretas de serviços externos no banco — toda mutação passa por
  Server Actions/Route Handlers da aplicação.

Ver [docs/PRODUCT.md](docs/PRODUCT.md) para a lista completa e o racional de
produto.
