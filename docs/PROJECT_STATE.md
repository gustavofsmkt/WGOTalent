# Estado do Projeto

## Natureza do Projeto
**Greenfield** (Novo projeto construído do zero, focado em MVP rápido)

## Stack Congelada & Versões Instaladas
> **Nota de Arquitetura**: O `Create T3 App` foi utilizado **exclusivamente como scaffolder** para gerar a fundação integrada. A aplicação **não** utiliza tRPC, Prisma ou Auth.js/NextAuth.

- **Framework**: Next.js 15.2.3 (App Router)
- **Linguagem**: TypeScript 5.8.2
- **UI / React**: React 19.0.0
- **Estilização**: Tailwind CSS 4.0.15 (`@tailwindcss/postcss`)
- **Banco de Dados**: PostgreSQL (Driver `postgres` 3.4.4)
- **ORM**: Drizzle ORM 0.41.0 (`drizzle-kit` 0.30.5)
- **Validação de Env & Dados**: Zod 3.24.2 + `@t3-oss/env-nextjs` 0.12.0

## Arquitetura Resumida
A arquitetura é focada em convenções estritas do **Next.js App Router**:
- **Leituras**: Apenas via **Server Components**. Cada página busca seus próprios dados diretamente da camada Drizzle. Sem client-side fetching e sem Route Handlers para dados internos. Todas as consultas trafegam obrigatoriamente por um utilitário central `notDeleted()`.
- **Escritas**: Apenas via **Server Actions** (`use server`). Estas actions cuidam da validação (Zod), mutação e da revalidação do cache local (`revalidatePath`).
- **Webhooks & Arquivos**: Route Handlers (`app/api/`) são usados estritamente para endpoints de integração (receber payload de IA via n8n) e para servir o streaming controlado dos currículos hospedados no disco.
- **Integridade de Deleção (Soft Delete)**: O uso do `ON DELETE CASCADE` nativo do Postgres é proibido. Exclusões em cascata ocorrem integralmente via camada da aplicação rodando múltiplas atualizações em uma única transação no DB.
- **Armazenamento**: O armazenamento abstrato (`StorageProvider`) lida com os arquivos em File System de forma a não encher os diretórios públicos (`public/`).

## Decisões Pendentes / Em Aberto
- **Chave de Desduplicação de Ingestão**: Ainda é preciso desenhar como lidar com atualizações de candidatos/triagens duplicadas na ingestão de e-mails, já que o schema não possui uma chave de deduplicação idempotente para novos e-mails entrantes processados pelo n8n.
- **Reativação de Soft Deletes**: O comportamento e as regras de negócio para reativar um usuário/candidato deletado logicamente precisam ser definidos explicitamente (ex: se um webhook do n8n re-inserir um candidato já soft-deleted, ele será reativado ou bloqueado?).
- **Implementação da Autenticação**: Estratégia, provedor de login e autorização não fazem parte do MVP, mas as rotas precisam manter o preparo de fronteira para plugar futuramente.

## Links de Referência
- [Spec: Modelo de Dados & SQL Types](specs/db_triagem_proposta.ts)
- [Spec: Prompt Base & Regras de Arquitetura Next.js](specs/hr-platform-nextjs-architecture-prompt.md)
