# Estado do Projeto

## Natureza do Projeto
**Greenfield** (Novo projeto construído do zero, focado em MVP rápido)

## Stack Congelada & Versões Instaladas
> **Nota de Arquitetura**: O `Create T3 App` foi utilizado **exclusivamente como scaffolder** para gerar a fundação integrada. A aplicação **não** utiliza tRPC, Prisma ou Auth.js/NextAuth.

- **Framework**: Next.js 16+ (App Router)
- **Linguagem**: TypeScript 5.8.2
- **UI / React**: React 19.0.0
- **Estilização**: Tailwind CSS 4.0.15 (`@tailwindcss/postcss`)
- **Banco de Dados**: PostgreSQL (Driver `postgres` 3.4.4)
- **ORM**: Drizzle ORM 0.41.0 (`drizzle-kit` 0.30.5)
- **Validação de Env & Dados**: Zod 3.24.2 + `@t3-oss/env-nextjs` 0.12.0
- **Formulários**: TanStack Form 1.33.5 (`@tanstack/react-form`)

## Arquitetura Resumida
A arquitetura é focada em convenções estritas do **Next.js App Router**:
- **Leituras**: Apenas via **Server Components**. Cada página busca seus próprios dados diretamente da camada Drizzle. Sem client-side fetching e sem Route Handlers para dados internos. Todas as consultas trafegam obrigatoriamente por um utilitário central `notDeleted()`.
- **Escritas**: Apenas via **Server Actions** (`use server`). Estas actions cuidam da validação (Zod), mutação e da revalidação do cache local (`revalidatePath`).
- **Webhooks & Arquivos**: Route Handlers (`src/app/api/`) são usados estritamente para endpoints de integração (receber payload de IA via n8n) e para servir o streaming controlado dos currículos hospedados no disco.
- **Integridade de Deleção (Soft Delete)**: O uso do `ON DELETE CASCADE` nativo do Postgres é proibido. Exclusões em cascata ocorrem integralmente via camada da aplicação rodando múltiplas atualizações em uma única transação no DB.
- **Armazenamento**: O armazenamento abstrato (`StorageProvider`) lida com os arquivos em File System de forma a não encher os diretórios públicos (`public/`).


## Integração n8n
- Três endpoints: `/api/webhooks/n8n/candidatos` (inbound), `/api/webhooks/n8n/triagem` (inbound), `CLASSIFICADOR_N8N_WEBHOOK_URL` (outbound).
- Fluxo candidato: n8n extrai currículo → plataforma registra → plataforma aciona Classificador por cidade → n8n avalia → plataforma persiste Triagem+AvaliacaoIA.
- Fluxo vaga: RH cadastra vaga → plataforma aciona Classificador por cidade → n8n avalia → plataforma persiste Triagem+AvaliacaoIA.

## Links de Referência
- [Spec: Modelo de Dados & SQL Types](db_triagem_proposta.ts)
- [Arquitetura](ARCHITECTURE.md)
