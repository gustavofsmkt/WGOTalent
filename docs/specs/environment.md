# Variáveis de Ambiente (Environment Variables)

A plataforma utiliza o pacote `@t3-oss/env-nextjs` com o Zod para validação rigorosa de variáveis de ambiente. Todas as variáveis devem ser definidas e validadas no arquivo `src/env.js`.

## Variáveis do Servidor (Server-side)

| Variável | Tipo | Descrição | Status |
|---|---|---|---|
| `DATABASE_URL` | `z.string().url()` | String de conexão com o PostgreSQL. | Implementado |
| `NODE_ENV` | `z.enum(...)` | Ambiente de execução (`development`, `test`, `production`). | Implementado |
| `STORAGE_ROOT` | `z.string().min(1)` | Caminho absoluto para o diretório de armazenamento de currículos no disco local. | Implementado |

## Variáveis do Cliente (Client-side)

*(Atualmente não há variáveis de ambiente expostas para o lado do cliente com o prefixo `NEXT_PUBLIC_`)*
