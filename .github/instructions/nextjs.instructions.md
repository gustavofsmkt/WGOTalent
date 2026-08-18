---
path:
  - "src/app/**/*.ts"
  - "src/app/**/*.tsx"
  - "src/actions/**/*.ts"
---

# Instruções Next.js (WGOTalent)

Estas regras se aplicam aos arquivos do Next.js App Router e Server Actions do projeto:

- **Server Components por padrão**: Todo componente é um Server Component a menos que precise de estado, ciclo de vida ou hooks do navegador.
- **Client Boundary mínimo**: Utilize a diretiva `"use client"` no menor nível possível na árvore de componentes (leaf components), isolando o estado e minimizando o bundle enviado ao cliente.
- **Leitura de dados (Reads)**: As leituras devem ser feitas diretamente da camada de banco de dados nos Server Components.
- **Sem Fetch interno**: NUNCA utilize `fetch` em um Server Component para chamar a própria API do projeto.
- **Escrita de dados (Writes)**: Todas as mutações e validações devem ser implementadas usando **Server Actions** (`src/actions`).
- **Revalidação de cache**: Sempre utilize `revalidatePath` (ou `revalidateTag`) nas Server Actions após realizar mutações para refletir os novos dados na UI.
- **Route Handlers não são BFF interno**: Não utilize Route Handlers (`route.ts`) como BFF para o próprio frontend. Eles são destinados para webhooks ou integrações externas.
- **Estados de Rota**: Implemente ativamente os arquivos de convenção do Next.js (`loading.tsx`, `error.tsx` e `not-found.tsx`) para feedback coeso de UI.
- **Cleanup**: Ao refatorar ou substituir um padrão, remova completamente os arquivos e códigos obsoletos para manter o repositório limpo.