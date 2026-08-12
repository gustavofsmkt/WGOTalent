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
