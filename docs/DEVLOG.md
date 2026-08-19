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
