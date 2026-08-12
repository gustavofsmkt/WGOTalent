# Arquitetura do Sistema - WGOTalent

Este documento define a arquitetura Greenfield para o projeto WGOTalent. O projeto utiliza o **Create T3 App** apenas como *scaffolder* inicial, adotando um subconjunto específico de tecnologias e descartando ferramentas padrão não necessárias ao nosso domínio.

## 1. Visão Geral da Stack

- **Framework:** Next.js (App Router)
- **Banco de Dados:** PostgreSQL
- **ORM:** Drizzle ORM
- **Infraestrutura:** PostgreSQL via Docker (Docker Compose). O n8n é executado **fora** do Compose (ambiente externo).

## 2. Diagrama de Arquitetura

```mermaid
flowchart TD
    Browser[Browser / Client Components]
    SC[Server Components]
    SA[Server Actions]
    WH[Webhooks / Route Handlers]
    Zod[Zod Validation]
    DB[(PostgreSQL)]
    n8n[n8n Externo]
    Storage[Storage Provider]
    IA[AvaliacaoIA - Inline na Triagem]

    Browser -- "Reads" --> SC
    Browser -- "Writes Internos" --> SA
    n8n -- "Writes Externos" --> WH
    
    SC -- "Leitura Direta" --> DB
    SA -- "Mutação / Transação" --> DB
    
    WH -- "Validação" --> Zod
    Zod -- "Transação" --> DB
    WH -- "Uploads de Arquivos" --> Storage
    
    SA -. "Triagem dispara" .-> IA
    IA -. "Salva resultado" .-> DB
```

## 3. Fluxo de Dados e Integrações

- **Reads (Leituras):** Realizados exclusivamente via **Server Components**.
- **Writes Internos:** Realizados exclusivamente via **Server Actions**.
- **Writes Externos (n8n):** O n8n se comunica via **Webhooks** no Next.js (Route Handlers). O payload deve passar sempre por validação com **Zod**, seguida de uma transação no Drizzle.
- **Arquivos:** O manuseio de arquivos é feito utilizando um `StorageProvider` chamado a partir de um Route Handler.
- **Avaliação de IA:** A funcionalidade de `AvaliacaoIA` roda de forma **inline** dentro do processo de Triagem.

## 4. Estrutura de Diretórios (Convenção T3 preservada)

A estrutura de diretórios preserva a convenção `src/` original do scaffold, sendo reduzida aos domínios estritamente utilizados:

```text
src/
├── app/          # Rotas do App Router, Pages, Layouts, Route Handlers (webhooks)
├── actions/      # Server Actions isoladas
├── components/   # UI Components (Client e Server)
├── lib/          # Utilitários, hooks, providers e integrações externas
├── server/
│   └── db/       # Configuração do Drizzle ORM e definição de schemas
├── styles/       # CSS global (Tailwind)
└── env.js        # Validação de variáveis de ambiente com T3 Env
```

## 5. Regras de Limpeza e Substituição (Scaffold T3)

O Create T3 App introduz várias dependências que não fazem parte desta arquitetura. Aplica-se a seguinte regra rigorosa:

- **NÃO** introduzir a pasta `src/server/api` ou o pacote **tRPC**.
- **NÃO** introduzir **Auth.js** (NextAuth) ou qualquer outra biblioteca/camada não listada na base técnica aprovada, apenas porque compõem outras combinações do T3.

## 6. Fronteiras de Confiança (Trust Boundaries)

- **Client Components (Browser):** Zona **não confiável**. Nunca exponha lógicas sensíveis, chaves ou métodos diretos de banco de dados.
- **Server Components / Server Actions:** Zona **confiável**. Têm permissão para usar o Drizzle e manipular o banco de dados diretamente.
- **Webhooks (Route Handlers):** Ponto de entrada de fontes externas (como n8n). **Obrigatório** o uso de Zod para sanitização absoluta de payloads de entrada antes de chegar à camada de dados.

## 7. Práticas Estritamente Proibidas

1. **Proibido criar API REST interna para CRUD:** As mutações que se originam de interações do usuário no próprio frontend devem usar **Server Actions**.
2. **Proibido acesso ao DB em Client Components:** O uso de Drizzle e acessos a dados ou credenciais do Postgres não podem ser vazados para componentes de lado cliente sob hipótese alguma.
