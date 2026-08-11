# Instruções para o GitHub Copilot (WGOTalent)

Este repositório contém diretrizes estritas para a evolução do WGOTalent. Ao atuar neste projeto, siga estas regras impreterivelmente.

## 1. Precedência de Fontes
1. Instruções neste arquivo e na pasta `docs/` (`ARCHITECTURE.md`, `DEVELOPMENT_METHOD.md`, `PRODUCT.md`).
2. Documentação oficial da versão **exata** instalada no projeto (supera exemplos de skills antigas).
3. Conhecimento geral do modelo.

## 2. Stack e Restrições (T3 Stack)
- **T3 Stack APENAS como scaffolder**: Usado exclusivamente para configuração inicial.
- **PROIBIDO no MVP**: tRPC, Auth.js/NextAuth e Prisma.
- **Estrutura Preservada**: Mantenha a estrutura útil em `src/` gerada pelo scaffold.
- **Convenções Aprovadas**: `src/server/db/schema.ts`, `src/server/db/index.ts` e `src/env.js` são convenções estruturais aprovadas e intocáveis do scaffold.

## 3. Arquitetura Frontend e Backend
- **Frontend**: Next.js App Router (React), TanStack Form + Zod, shadcn/ui e Tailwind CSS.
- **Next.js**: Uso estrito e bem delimitado de Server Components, Server Actions e Route Handlers (consulte `docs/ARCHITECTURE.md`).
- **N8N**: NUNCA escreve no banco de dados. Apenas consumo/orquestração via webhooks ou APIs REST expostas.

## 4. Regras de Banco de Dados e Drizzle (PostgreSQL)
- **Fluxo Drizzle**: Schema-first (generate -> review -> migrate). 
- **Soft Delete Global**: NUNCA remova registros fisicamente. Todas as entidades principais devem possuir exclusão lógica (ex: `deletedAt`).
- **Cascade de Candidato**: A exclusão lógica de um Candidato exige cascade em suas dependências via aplicação.
- **Leituras**: Toda query de leitura **DEVE** incluir restrição/filtro ignorando registros deletados (`notDeleted` / `deletedAt is null`).

## 5. Práticas de Desenvolvimento e Chat
- **Limites por Interação**: Uma tarefa/foco por chat.
- **Contexto Mínimo**: Forneça ou busque apenas o contexto estritamente necessário.
- **Dependências**: Zero dependências fora de escopo (não instale libs sem aprovação).
- **Substituição implica Cleanup**: Ao refatorar ou substituir lógicas, apague o código obsoleto.
- **Testes e Segredos**: Mantenha cobertura de testes onde aplicável; NUNCA commite segredos ou credenciais.

## 6. Git e Workflow
- **PROIBIDO PUSH**: O Copilot/Agent NUNCA deve executar `git push`.
- Mantenha padronização atômica usando Conventional Commits.

> Para detalhes aprofundados sobre regras de negócio, métodos e estrutura, consulte os respectivos arquivos no diretório `docs/`. Não duplique regras aqui se já estiverem consolidadas na documentação.
