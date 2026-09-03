# DEVLOG - WGOTalent

Este documento mantém o registro factual e objetivo das funcionalidades implementadas, refatorações concluídas e marcos estruturais (milestones) atingidos durante o desenvolvimento.

## Marco: TASK-019 — Criação da Fundação Mínima com Create T3 App
*Data: 2026-08-11*

- Scaffold gerado utilizando `create-t3-app` como ferramental de inicialização (**somente como scaffolder**).
- Selecionadas as opções: Next.js App Router, TypeScript, Tailwind CSS, Drizzle ORM, PostgreSQL (npm).
- Excluídos explicitamente: tRPC, Prisma e Auth.js/NextAuth.
- Preservadas as convenções de diretório `src/`, utilitário `src/env.js`, e configurações de banco em `src/server/db/`.
- Preservados todos os artefatos de harness, instruções, specs, documentação e diretórios de projeto (`.git`, `.github`, `.claude`, `.vscode`, `docs`).
- Validados os scripts de verificação de tipos (`typecheck`) e compilação de produção (`next build`), obtendo sucesso sem erros.

## Marco: Validação do Greenfield Agent Harness
*Data: 2026-08-11*

- Realizada auditoria completa de instruções, agents, prompts, skills, docs e specs.
- Pesquisadas e sanadas eventuais contradições sobre o uso estrito do **Create T3 App apenas como scaffolder**.
- Confirmada a proibição e ausência de orientações que exigissem Prisma, Supabase, tRPC, Auth.js/NextAuth no MVP, n8n com acesso de escrita direta ao banco de dados, API CRUD interna, e hard deletes.
- Substituídas instruções obsoletas (ex: React Hook Form e adapter Zod específico em skills) pelas abordagens padrão adotadas (TanStack Form e Zod v4).
- Ajustadas referências no `implementer.agent.md` e em skills fornecidas para alinhar-se à arquitetura pretendida.

## Marco: TASK-024 — Instalação do TanStack Form e Consolidação do Zod
*Data: 2026-08-12*

- Instalado `@tanstack/react-form` (`1.33.5`) para gerenciamento de formulários no lado do cliente.
- Mantido o `zod` (`3.24.2`) como validador único, aproveitando o suporte nativo ao protocolo Standard Schema (`~standard`).
- Descartadas instalações desnecessárias (`@tanstack/react-form-nextjs`, `@tanstack/zod-form-adapter`, React Hook Form).
- Criado o documento `docs/FORM_STACK.md` registrando as versões, decisões e padrões de integração client/server com Server Actions.

## Marco: TASK-026 — Extensão do Ambiente Tipado do T3
*Data: 2026-08-12*

- Estendida a validação tipada em `src/env.js` com as variáveis server-side `WEBHOOK_N8N_SECRET` e `STORAGE_ROOT`.
- Preservada `DATABASE_URL` e mantido `src/env.js` como única fonte de validação de variáveis de ambiente.
- Removidas variáveis de exemplo do T3 (`NEXT_PUBLIC_CLIENTVAR`).
- Atualizado o arquivo `.env.example` refletindo os novos esquemas e valores padrão para desenvolvimento.
- Adicionados testes automatizados em `src/env.test.ts` para verificar o parsing, tratamento de falhas e garantir que segredos não sejam expostos em mensagens de erro.

## Marco: TASK-053 — Aplicação de Migrações em Banco Vazio
*Data: 2026-08-14*

- Inicializado container PostgreSQL descartável via Docker Compose com volume limpo/recreado (`wgotalent-postgres`).
- Executado e validado `npm run db:smoke` no banco zerado, confirmando conectividade e suporte à extensão `unaccent`.
- Aplicadas as 10 migrações Drizzle em sequência através do `npm run db:migrate` sem uso de `db:push`.
- Confirmada a aplicação completa das migrações na tabela de controle `drizzle.__drizzle_migrations` (10 registros gravados).
- Re-executado `npm run db:smoke` no banco migrado obtendo sucesso absoluto.
- Inspecionadas todas as 9 tabelas criadas no schema `public` (`wgotalent_departamentos`, `wgotalent_cargos`, `wgotalent_vagas`, `wgotalent_candidatos`, `wgotalent_candidato_formacoes`, `wgotalent_candidato_experiencias`, `wgotalent_candidato_certificacoes`, `wgotalent_triagens`, `wgotalent_avaliacao_ia`), confirmando a criação de 104 constraints (PKs, FKs, Uniques, Checks) e 22 índices.

## Marco: TASK-075 — Validação e Limpeza do Domínio Departamento
*Data: 2026-08-18*

- Revisão completa do domínio `Departamento`: repository (`departamentoRepository`), Server Actions (`createDepartamento`, `updateDepartamento`, `deleteDepartamento`), validação Zod (`departamentoSchema`), formulário compartilhado (`DepartamentoForm`) e páginas de listagem, criação, detalhe e edição.
- Validação e cobertura de testes para Server Actions em `src/actions/departamentos.test.ts`, confirmando criação, edição, tratamento de erro de unicidade (código 23505) e bloqueio de exclusão quando o departamento possui cargos ativos vinculados (`hasActiveCargos`).
- Limpeza de import não utilizado em `src/app/(rh)/departamentos/[id]/page.tsx` e correção de tipagem em `src/app/(rh)/departamentos/page.test.ts`.
- Auditoria de limpeza: confirmada a ausência de APIs CRUD internas de departamento (zero rotas sob `/api/departamentos`), formulário unificado sem duplicidades e ausência de arquivos órfãos.
- Sucesso nos quality gates: 15 arquivos de teste e 162 testes passando no Vitest, typecheck estrito (`tsc --noEmit`) sem erros e `next build` executado com sucesso.

## Marco: TASK-080 — Validação e Limpeza de Cargo
*Data: 2026-08-19*

- Validado o CRUD completo de Cargos utilizando o Drizzle ORM e Server Actions.
- Confirmada a ausência de APIs internas (`src/app/api/cargos/` não existe), centralizando operações em `src/actions/cargos.ts`.
- Validada a regra de bloqueio de exclusão lógica (soft delete) quando há vagas ativas vinculadas, com testes unitários passando em `cargos.test.ts`.
- Adicionado `export const dynamic = "force-dynamic"` em `src/app/(rh)/cargos/novo/page.tsx` para contornar falhas de prerenderização estática no processo de build do Next.js sem conexão ao banco.
- Executadas com sucesso as etapas de verificação de tipos (`typecheck`), testes (`test:run`) e compilação de produção (`build`).

## Marco: TASK-085 � Valida��o e limpeza de Vaga
*Data: 2026-08-19*

- Validado CRUD, status, constraints e regras de soft delete de Vaga.
- Verificado e confirmado atrav�s de testes (src/actions/vagas.test.ts) que o soft delete da Vaga preserva o hist�rico (ex. Triagens) n�o causando soft delete em cascata.
- Qualidade garantida com lint, typecheck, todos os testes (Vitest) passando e build Next.js bem sucedido.
- Realizada verifica��o com Get-ChildItem procurando por arquivos �rf�os (example, demo, placeholder) retornando limpo.
- Confirmada aus�ncia de chamadas e APIs CRUD rest em favor de Server Actions e Server Components.
## Marco: TASK-098 — Validação e Limpeza do Domínio Candidato
*Data: 2026-08-19*

- Validado todo o domínio `Candidato`: listagem, detalhe completo (com preferências, experiências, formações, certificações, triagens), formulário agregado e views de criação/edição.
- Confirmado o soft delete em cascata (`deleteCandidato`) propagando corretamente a data de exclusão para formações, experiências, certificações, triagens e avaliações de IA filhas.
- Testes unitários/integração abrangentes para as actions de criação, atualização, validação de email unique e formatação do payload, todos rodando com sucesso.
- Zod schema validando e impedindo missing de e-mail e celular (`candidatoSchema`).
- Removido typecasting problemático (N+1) e otimizadas as views de listagem e detalhe completo via `notDeleted()` de forma consistente, ocultando excluídos lógicos.
- Sucesso nos quality gates: testes, linting, build Next.js com Server Actions funcionais. Nenhuma API CRUD paralela criada.

## Marco: TASK-105 — Validação e Limpeza de Triagem
*Data: 2026-08-20*

- Validado o fluxo completo de pipeline de Triagens (listagem, filtros, detalhes com/sem IA, criação e edição).
- Testada a regra de `partial unique`, onde um candidato não pode ter mais de uma triagem `em_andamento` para a mesma vaga.
- Testado o schema e condicionais: motivo exigido e validado para resultados de reprovação e desistência.
- Assegurada a correta exibição e edição de Triagens via Server Components/Server Actions.
- Confirmada a ausência de CRUD independente para `AvaliacaoIA`.
- Sucesso em todas as etapas de build, verificação de tipos (`typecheck`) e nos 293 testes do repositório (Vitest).

## Marco: TASK-137 a TASK-153 — Motor de Agentes IA e Upload em Lote
*Data: 2026-08-20*

- Implementado o motor de agentes nativo (ADR-0007) com provedor Gemini via Google AI Studio (`@google/genai`): tabelas `llm_credenciais` e `agente_config` (3 slots fixos, seed idempotente), cifra de credenciais em repouso (AES-256-GCM), cliente Gemini com saída estruturada e resolvedor de template `{{variavel}}`.
- Implementados os 3 agentes: `extracao_curriculo` (multimodal PDF/PNG/JPEG, conversão de texto via `mammoth` para DOCX), `classificador_aderencia` (fase 1, pontuação em lote com chunking de até 25 itens, direction-agnostic), `avaliador_triagem` (fase 2, grava `avaliacao_ia`).
- Orquestração fechada: candidato novo → vagas abertas na mesma cidade; vaga nova → candidatos ativos na mesma cidade; aplica threshold configurável, evita duplicar `Triagem` para o mesmo par (índice único não é parcial, então soft-delete não libera o par), roda a fase 2 com concorrência limitada (`runWithLimit`, sem dependência nova).
- Disparo real ligado em `createCandidato` e `createVaga` (fire-and-forget); placeholders `console.log`/`TODO` removidos.
- Upload em lote de currículos (até 15 arquivos, `experimental.serverActions.bodySizeLimit` ajustado para 80mb) com extração real desde o início — tela em `/candidatos/upload-lote`.
- Migration relaxando `dataNascimento`/`cep`/`bairro`/`logradouro` para nullable em `candidatos` (currículo raramente traz esses dados) e nova coluna `dados_pendentes`; o formulário manual continua exigindo esses campos (schema Zod inalterado nesse caminho).
- Admin: `/admin/agentes` (config dos 3 slots) e `/admin/credenciais` (CRUD write-only da API key, nunca reexibida); sem autenticação, por decisão já registrada em `PRODUCT.md`.
- Corrigido bug real encontrado ao rodar o app: `src/app/(admin)/` é route group do Next.js e não gera prefixo de URL — as páginas caíam em `/agentes`/`/credenciais` em vez de `/admin/agentes`/`/admin/credenciais`. Renomeado para `src/app/admin/` (pasta real).
- Verificado com `npm run dev` real (não só testes): telas de admin testadas com escrita/leitura reais no banco, upload em lote renderizado, triagens com `avaliacao_ia` inline funcionando. Migration 0012 estava gerada mas não aplicada no banco de dev — corrigido com `npm run db:migrate`.
- Sucesso em todas as etapas de build, verificação de tipos (`typecheck`) e nos 304 testes (Vitest).
- Fora de escopo, deliberadamente: canal de e-mail (Zimbra/M365/Google Workspace) e autenticação/autorização.

## Marco: TASK-115 — Queries do Dashboard
*Data: 2026-08-20*

- Criado `dashboardRepository` em `src/server/db/repositories/dashboard.ts` com queries sumarizadas para as métricas do Dashboard.
- Métricas semânticas implementadas com proteção de soft delete (`notDeleted()` / `isNull(deletedAt)`):
  - `countVagasAbertas`: contagem de vagas com status `aberta` e não deletadas.
  - `countCandidatosAtivos`: contagem de candidatos cadastrados e ativos no banco de talentos.
  - `countTriagensEmAndamento`: contagem de triagens em andamento (`resultado = 'em_andamento'`).
  - `countTriagensTotais`: contagem total de triagens históricas não deletadas.
  - `getTriagensPorEtapa`: distribuição agregada por etapa do funil (`curriculo`, `testes`, `entrevista_rh`, `entrevista_gestor`, `finalizado`).
  - `getTriagensPorResultado`: distribuição agregada por resultado (`em_andamento`, `aprovado`, `reprovado`, `desistente`, `banco_talentos`).
  - `getMediaScoreIa`: média aritmética do `score_ia` das avaliações de IA não deletadas vinculadas a triagens ativas.
  - `getVagasComMaisCandidatos`: ranking de vagas com maior volume de candidatos associados com projeção enxuta para evitar overfetch.
  - `getAtividadeRecente`: feed das atividades de triagem mais recentes com projeção mínima.
  - `getDashboardSummary`: orquestrador de consulta paralela de todas as métricas do dashboard via `Promise.all`.
- Cobertura de testes unitários e estruturais em `src/server/db/repositories/dashboard.test.ts`. Todos os 45 arquivos de teste e 355 testes do Vitest passando com sucesso.

## Marco: TASK-116 — Dashboard WGOTalent
*Data: 2026-08-20*

- Implementada a interface do Dashboard como Server Component em `src/app/(rh)/dashboard/page.tsx`, consumindo `dashboardRepository.getDashboardSummary()`.
- Substituído o placeholder anterior pela visão geral completa aderente a `docs/DESIGN.md` e referências mapeadas em `docs/UI_REFERENCE_MAP.md`.
- Componentes e seções integrados:
  - **Header & CTAs**: `PageHeader` com atalhos rápidos para "Upload em Lote", "Nova Vaga" e "Novo Candidato".
  - **KPIs Principais**: Cards de métricas com ícones e links rápidos para Vagas Abertas, Candidatos Ativos, Triagens em Andamento (com total histórico) e Score Médio de IA (com barra de progresso e total de avaliações computadas).
  - **Funil de Triagens**: Visualização de barras em CSS puro para distribuição de candidatos por etapa (`curriculo`, `testes`, `entrevista_rh`, `entrevista_gestor`, `finalizado`), calculando percentuais dinâmicos.
  - **Desfecho das Triagens**: Breakdown visual de resultados (`em_andamento`, `aprovado`, `reprovado`, `desistente`, `banco_talentos`) com indicadores de cor e percentual.
  - **Vagas com Mais Candidatos**: Tabela com posições ativas, localização, badges de vagas e candidatos vinculados, com links diretos para cada vaga.
  - **Atividade Recente**: Feed das últimas movimentações no funil de seleção com avatar por iniciais, etapa e resultado via `StatusBadge`, badge de Score de IA com ícone de faísca e timestamps formatados.
- Tratamento de estados vazios com `DataEmptyState` para todas as seções quando não houver dados cadastrados.
- Design totalmente responsivo (mobile, tablet e desktop), acessível e sem dependência de bibliotecas adicionais de gráficos.
- Cobertura de testes unitários e de agregação em `src/app/(rh)/dashboard/page.test.ts`.
- Validados todos os 46 arquivos de teste e 359 testes no Vitest, typecheck estrito (`tsc --noEmit`) sem erros e build de produção Next.js executado com sucesso.

## Marco: Restauração e Mesclagem de Candidato Duplicado (ADR-0008)
*Data: 2026-08-20*

- Substituída a rejeição por conflito de e-mail (ADR-0002) por restauração/mesclagem: cadastro manual ou upload em lote com e-mail já existente agora restaura o candidato se ele estiver soft-deleted, ou mescla os dados novos/diferentes se estiver ativo, devolvendo-o ao fluxo de triagem quando aplicável.
- Implementados `restoreAggregate`/`mergeAggregate` em `candidatoRepository`, com mesclagem aditiva de campos escalares e de filhos (nunca sobrescreve dado já preenchido com vazio).
- Mesclagem com dado novo exclui (soft delete) as triagens ainda na etapa `curriculo` do candidato e reenvia o candidato pelo motor de matching (`classificador_aderencia`).
- Corrigidos `existsForPar` e o índice único parcial de triagens para considerar `deleted_at` (migration 0013), que bloqueava indevidamente a recriação de triagens para pares candidato/vaga já vistos antes.
- ADR-0008 registrada e substitui a ADR-0002.

## Marco: TASK-117 a TASK-120 — Auditorias de Produto (Design, Performance, Formulários, Soft Delete)
*Data: 2026-08-22 a 2026-08-23*

- **TASK-117 (design/Impeccable):** padronizado o cabeçalho de páginas de detalhe (`vagas/[id]`, `cargos/[id]`, `triagens/[id]`) para `PageHeader` + botão de voltar com `ArrowLeft`, substituindo cabeçalhos custom e `ChevronRight` como breadcrumb; estados vazios migrados para `DataEmptyState`; removidos imports não utilizados.
- **TASK-118 (performance React/Next):** eliminado round-trip redundante de banco em `vagas/[id]` (campo `descricao` incorporado à projeção existente); paralelizadas buscas independentes em `vagas/[id]/editar` e `candidatos/[id]/editar` via `Promise.all`; `TriagemDetailEditor` dividido para reduzir o payload RSC serializado (cartões de contato e avaliação de IA passam a ser Server Components); troca do dirty-check por `JSON.stringify` (rodava a cada tecla) por comparação campo a campo; `UploadProgressPopup` convertido para `next/dynamic`; adicionado `(rh)/loading.tsx`.
- **TASK-119 (formulários):** corrigido bug real em que um validador de schema no nível do formulário escrevia erros em todos os campos registrados no `onBlur`, fazendo campos obrigatórios ainda não tocados piscarem como inválidos; removida duplicação de regra de `motivo` entre `triagem-form` e `triagemSchema.superRefine`; removidos validadores `onChange` redundantes em `vaga-form`; tipado `candidato-form` com o `ReactFormExtendedApi` real (removendo `any`), o que revelou um bug real de `Input value` não protegido contra `null` após `email`/`celular` se tornarem nullable.
- **TASK-120 (soft delete):** corrigidos cinco caminhos de leitura que usavam `.where(isNull(...))` inline em vez do helper `notDeleted()` (`dashboardRepository.getMediaScoreIa`, `getVagasComMaisCandidatos`, `getAtividadeRecente`, `departamentoRepository.findAllWithActiveCargosCount`) e dois métodos de `agenteConfigRepository` sem filtro de soft delete algum (`findAll`/`findBySlot`); adicionados testes de regressão que espionam `notDeleted()` e cobertura de cascata para `candidatoRepository.softDelete` (antes sem testes).
- Falha/correção comum às quatro auditorias: nenhuma regressão funcional introduzida; todas as correções foram desvios objetivos encontrados durante a auditoria, não features novas.

## Marco: TASK-121 a TASK-126 — Limpeza Final e Documentação Operacional
*Data: 2026-08-23*

- **TASK-121:** removidos componentes shadcn sem uso (`skeleton.tsx`, `toast.tsx`, 247 linhas).
- **TASK-122:** auditoria completa do repositório versionado; removido `WGOTalent_ROTEIRO_CORRECAO_MIGRACAO_IA.md` (CORR-01 a CORR-14 já executados e superseded pela ADR-0007); consolidado `docs/DESIGN_DECISIONS.md` na sequência canônica de ADRs como `docs/decisions/0009-icon-system-lucide-react.md`, eliminando uma fonte de verdade duplicada; corrigido `.github/instructions/integrations.instructions.md`, que ainda descrevia o motor de agentes nativo como baseado no Vercel AI SDK com placeholders `TODO` — a Fase 14 (TASK-137 a TASK-153) já estava implementada usando `@google/genai` diretamente.
- **TASK-123:** normalizados os scripts npm (`lint`, `build`, `test`, `test:run`, `db:generate`, `db:migrate`, `db:seed`, `db:smoke`) e criados os gates padrão `check` (lint + test:run + build) e `check:integration` (db:migrate + db:smoke). Introduzido ESLint (`eslint-config-next`, flat config) pela primeira vez no projeto, o que revelou 99 erros pré-existentes de `@typescript-eslint/no-explicit-any` em actions, repositories e seus testes; todos corrigidos com tipos reais (`Candidato`, `CandidatoDetailCompleto`, `Triagem`, `NovaTriagem`, `UploadLoteItem`, export default de `postgres` para `PostgresError`, `TriagemFiltros` restrito às uniões literais do `pgEnum`) em vez de afrouxar a regra.
- **TASK-124:** README reescrito com produto, stack, requisitos, variáveis de ambiente, Postgres via Docker, instalação, migrations, seed, storage, motor de agentes de IA, testes e harness/skills.
- **TASK-125:** criado `docs/SECURITY.md` cobrindo credenciais/chaves de IA em repouso, PII, currículo, path de storage, logs, variáveis de ambiente, ausência de autenticação no MVP e o fato de que soft delete não é anonimização.
- **TASK-126:** criado `TECHNICAL_WALKTHROUGH.md` em português explicando a arquitetura completa (T3 como scaffolder, App Router, Server Components/Actions, Drizzle/migrations, soft delete, TanStack Form, Zod, shadcn/Tailwind, StorageProvider, motor de agentes nativo conforme ADR-0007, fluxo candidato→triagem→IA e o harness/skills).
- Falha/correção: nenhuma pendência bloqueadora restante; os únicos "erros" corrigidos nesta fase foram os 99 achados do ESLint recém-introduzido (TASK-123), tratados como dívida técnica pré-existente e sanados na mesma tarefa.

## Marco: Captação Automática de Currículo por E-mail (ADR-0010)
*Data: 2026-08-24*

- Antecipada do roadmap pós-MVP para dentro do MVP atual por ser puramente aditiva — não toca em código já validado do motor de agentes ou dos CRUDs.
- Implementado cliente IMAP genérico (`imapflow` + `mailparser`, únicas dependências novas do bloco) cobrindo Zimbra/Google Workspace/M365 sem SDK proprietário por provedor.
- Loop de captura iniciado via `instrumentation.ts` (hook oficial do Next.js), guardado em `globalThis` para sobreviver ao HMR do `next dev` sem empilhar `setInterval`s; intervalo configurável por `EMAIL_CAPTURA_INTERVALO_MS`.
- Idempotência via watermark de UID IMAP por mailbox (`ultimoUidProcessado`): cada ciclo processa só UID maior que o último, e o watermark avança apenas até o que o ciclo efetivamente cobriu.
- Extração/dedup/merge do currículo compartilhada com o upload em lote via `processarCurriculoRecebido()`, extraída de `processarItemLote` nesta mesma mudança — os dois caminhos convergem no mesmo pipeline, só trocando `origem` para `"email"`.
- Credencial de e-mail (host/porta/usuário/senha/pasta, só uma ativa por vez) cadastrada na aba "Captação de E-mail" em `/admin`, reaproveitando a cifra AES-256-GCM e o padrão de UI já usados pelas credenciais de LLM.
- Corpo e assunto da mensagem nunca são persistidos nem logados — só os bytes dos anexos elegíveis (mesmos mimetypes/tamanho do upload manual) são extraídos.
- Corrigido bug real encontrado no processo: candidatos criados via upload em lote nunca tinham `origem` setado explicitamente, caindo silenciosamente no default `"manual"` mesmo vindo do pipeline de IA.
- Cota de IA excedida (`AgenteQuotaExcedidaError`) não descarta a mensagem — o watermark não avança sobre ela, ficando pendente para nova tentativa num ciclo seguinte.
- Migrations `0017` (`email_captacao_credenciais`) e `0018` (`email_capturar_desde`, filtro opcional de backfill por data).
- `RELEASE_SUMMARY.md` e `SECURITY.md` atualizados no mesmo bloco; `README.md` recebeu a seção "Captação de Currículo via E-mail".

## Marco: Segundo Provedor de LLM — OpenAI (ADR-0011)
*Data: 2026-08-25*

- Extraído contrato comum (`GerarRespostaEstruturadaInput<T>`), retry com backoff exponencial e parse+validação Zod da resposta de `gemini-client.ts` para `src/lib/agents/shared.ts`, compartilhado agora pelos dois clients de provedor.
- Adicionado `src/lib/agents/openai-client.ts`, chamando a Responses API da OpenAI (`/v1/responses`) via `fetch` nativo — sem SDK, sem dependência nova.
- Adicionado `src/lib/agents/agent-client.ts` como ponto único de despacho: os 3 agentes (extração, classificador, avaliador) deixaram de importar `gemini-client.ts` diretamente e hardcodar o provedor — agora leem `agenteConfig.provider` (campo que já existia no schema mas era ignorado) e o dispatcher escolhe o client certo.
- Schemas JSON de resposta dos 3 agentes reescritos para satisfazer o modo strict de Structured Outputs da OpenAI (todo campo em `required`, `additionalProperties: false`) permanecendo válidos para o Gemini — um único schema serve os dois provedores. Removido `format: "uri"` do schema de linkedin/portfólio, rejeitado pelo modo strict da OpenAI (validação de URL real já acontece depois, em `candidato.ts`).
- `provider-catalog.ts` ganhou a entrada `openai` com modelos reais, já consumida por `/admin/agentes` (o formulário já resetava o campo `model` ao trocar de provedor, escrito antecipando um segundo provedor real).
- Log de diagnóstico adicionado em falha de chamada nos dois clients — antes uma falha só surgia como "Falha ao chamar o provedor de LLM" sem nenhum rastro da causa real.
- ADR-0011, que descrevia esta extensão como roadmap pós-MVP ("quando esta fase for iniciada"), teve o `Status` corrigido para `Aceita` e recebeu uma nota de implementação apontando para os arquivos reais.

## Marco: Correção de normalização de CEP
*Data: 2026-08-25*

- Corrigido bug real de produção: currículos frequentemente grafam o CEP com ponto de milhar (ex. `"75.709-400"`, 10 caracteres) em vez do formato padrão (`"75709-400"`, 9) — o agente de extração transcreve o texto-fonte fielmente, incluindo o ponto, e o schema (`.max(9)`) rejeitava a extração inteira a cada tentativa, já que não era uma falha transiente.
- `cepSchema` passou a fazer preprocessamento (remove tudo que não for dígito ou hífen antes de validar), no mesmo padrão já usado por `optionalUrlSchema` para normalizar URLs sem esquema — normalização em vez de rejeição.

## Marco: Banco de Talentos Automático (ADR-0013)
*Data: 2026-08-25*

- Nova coluna booleana `candidatos.em_banco_talentos` (default `false`, migration `0019`): "banco de talentos" geral passou a ser propriedade do candidato, não da triagem — o enum `triagem_resultado` já tinha o valor `"banco_talentos"`, mas só se aplica a uma triagem já existente (`vaga_id` `NOT NULL`), não cobrindo o candidato que nunca teve nenhuma vaga compatível.
- Dois gatilhos automáticos dentro de `orquestrarParaCandidatoNovo` (antes retornava em silêncio nesses casos): nenhuma vaga aberta na cidade do candidato, ou vagas existem mas nenhuma passa no threshold do classificador.
- Reavaliação automática sem mudança de filtro: `orquestrarParaVagaNova` já varria todos os candidatos ativos da cidade, incluindo os do banco de talentos. Candidato sai do banco automaticamente em `processarParAprovado`, ponto único onde uma `Triagem` nova é de fato criada, compartilhado pelos dois sentidos de orquestração.
- Sem UI de edição manual do campo — valor 100% derivado da orquestração automática; o RH continua podendo usar `resultado = banco_talentos` numa `Triagem` específica para "não segue para esta vaga, mas continua interessante" (os dois conceitos coexistem, um é do candidato em geral, o outro é do par candidato-vaga).
- UI: badge de banco de talentos em `candidate-header.tsx` e nas listagens, novo filtro "Banco de Talentos" em `CandidatosFilter`, reaproveitando o tom já existente em `statusConfigMap`.
- Não reavalia retroativamente candidatos cujas triagens antigas terminaram em reprovado/desistente sem vaga alternativa — só entram no banco se passarem de novo por `orquestrarParaCandidatoNovo` (ex. reprocessamento por duplicidade) ou tiverem sido capturados depois desta decisão; aceito para o escopo pedido, podendo virar job de reavaliação periódica no futuro.

## Marco: Endurecimento do Motor Multi-Provedor + Claude (ADR-0011)
*Data: 2026-08-27*

- **Bug corrigido:** o motor "multi-provedor" da ADR-0011 não era operável na prática. Com o `classificador_aderencia` apontado para OpenAI pela tela de admin, toda chamada retornava HTTP 400 (`schema must be a JSON Schema of 'type: "object"', got 'type: "array"'`) — o schema de resposta do classificador tinha raiz `array`, que só o Gemini aceita. O erro era engolido por `runWithLimit` + `flatMap` (virava `[]`), a orquestração lia isso como "nenhuma vaga aderente" e **todo candidato caía no banco de talentos**.
- **Contrato formalizado:** `LlmAdapter` em `src/lib/agents/shared.ts` é o contrato único; `agent-client.ts` virou um registry `provider -> LlmAdapter` (`getLlmAdapter`, `providerSuportado`) no lugar do `switch`.
- **Invariante de raiz objeto:** novo `src/lib/agents/schema-dialect.ts` com `objetoComLista(prop, itemSchema)` (o classificador agora devolve `{ itens: [{ id, score }] }` e desembrulha no código) e `assertRaizObjeto(schema, contexto)`, chamado pelos adapters OpenAI e Anthropic para falhar rápido com mensagem acionável em vez de um 400 opaco do provedor.
- **Semântica de erro:** `executarClassificadorAderencia` passou a devolver um resultado discriminado — `{ ok: true, scores }` ou `{ ok: false, motivo: "falha_provedor" }` quando **todas** as chamadas falham (sucesso parcial continua tolerado). `orquestrarParaCandidatoNovo`/`orquestrarParaVagaNova` só mandam ao banco de talentos quando o classificador respondeu e nenhum score passou do threshold; falha de infra mantém o candidato ativo para reprocessamento.
- **Terceiro provedor: Claude.** Novo `src/lib/agents/anthropic-client.ts` — Messages API (`/v1/messages`) via `fetch` nativo (sem dependência nova, mesmo padrão do openai-client), saída estruturada por *tool* forçada (`tool_choice`), PDF/imagem como blocos `document`/`image` base64, detecção de quota (HTTP 429/529, `rate_limit_error`/`overloaded_error`). Entrada `anthropic` adicionada ao `provider-catalog.ts`.
- **Parâmetros por slot:** `agente_config.params` (jsonb, já existia e estava sem uso) passa a carregar `temperature` / `maxOutputTokens` / `topP` (nomes canônicos), editáveis na tela do agente (`AgenteConfigForm`) e mapeados por cada adapter para os nomes da sua API. `parseLlmParams` (em `lib/validation/agente-config.ts`) lê o jsonb com tolerância — valor inválido vira `undefined`, não derruba o agente.
- **Validação de config:** `agenteConfigUpdateSchema` valida `provider ∈ catálogo` e `model ∈ provider` (`superRefine`); `updateAgenteConfig` recusa **ativar** um slot sem credencial ativa para o provedor, com mensagem apontando para Administração › Credenciais. `provider-catalog.ts` ganhou `ProviderCapabilities` (`multimodalPdf`/`multimodalImage`) e o formulário só oferece provedores multimodais para o slot `extracao_curriculo`.
- **Refactor de `shared.ts`:** `parseRespostaEstruturada` (texto → JSON → Zod) foi dividido — `validarRespostaEstruturada` (só a parte Zod) é reusado pelo anthropic-client, que já recebe o objeto parseado de `tool_use.input`.
- Testes novos: `schema-dialect.test.ts`, `anthropic-client.test.ts` (12 casos), casos de `{ ok: false }` em `classificador-aderencia.test.ts` e "falha de provedor não marca banco de talentos" em `orquestracao.test.ts`. Suíte: 481 testes passando.
- **Fora do escopo desta mudança:** a rigidez do schema de extração (`dateStringSchema` recusa datas parciais; `cidade` `nonEmptyString`; colunas `data_inicio`/`data_entrada` `NOT NULL`) continua derrubando currículos sem data/cidade — track separada de resiliência da extração.

## Marco: Nota de Corte de Aderência por Vaga (ADR-0014)

*Data: 2026-09-03*

- A nota de corte deixou a configuração administrativa do `classificador_aderencia` e passou a ser configurada nos formulários de criação e edição de cada vaga.
- A orquestração candidato→vagas aplica a nota da vaga correspondente a cada score; a orquestração vaga→candidatos aplica a nota da vaga que iniciou o processamento.
- A migration `0023_move_nota_corte_to_vagas` preserva o limite global anterior nas vagas existentes antes de remover a coluna obsoleta de `agente_config`; novas vagas usam 65 por padrão.
- Adicionadas validação e constraint de banco para o intervalo de 0 a 100, exibição na tela de detalhes da vaga e testes de regressão do filtro por vaga.
