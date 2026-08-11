---
description: Diretrizes e padrões para banco de dados, Drizzle ORM, migrações e schema no PostgreSQL.
applyTo:
  - "src/server/db/**/*"
  - "drizzle/**"
  - "drizzle.config.ts"
  - "infra/postgres/**"
  - "**/*db*.ts"
---

# Instruções de Banco de Dados (Drizzle / Postgres)

Este arquivo define as diretrizes estritas para a arquitetura de banco de dados, Drizzle ORM e migrações no projeto WGOTalent.

## 1. Drizzle ORM e Migrações
- **Fluxo Schema-First Versionado:** Gere migrações a partir das alterações no schema (`generate`), revise o SQL gerado (`review`) e aplique (`migrate`).
- **NUNCA use push:** É estritamente proibido usar o comando de push (sincronização direta de schema). Migrações devem ser sempre versionadas.
- **Revisão de SQL:** Sempre revise o SQL gerado para garantir que as alterações (como deleções de coluna, criação de constraints e renomeações) estão corretas e não geram perda acidental de dados.

## 2. Exclusão Lógica (Soft Delete)
- **Zero Hard Delete na App:** Nenhuma entidade principal no projeto deve ser excluída fisicamente através da aplicação.
- **Soft Delete Global:** Todas as entidades devem possuir um mecanismo de soft delete, como uma coluna `deletedAt` (timestamp).
- **Filtro de Leitura (`notDeleted`):** Todas as queries de leitura DEVEM incluir a restrição que ignora registros deletados (ex: `deletedAt is null` ou usando helpers designados).

## 3. Constraints e Índices
- **Unique / Partial Unique:** Utilize índices únicos parciais ou constraints conforme a especificação do produto. Exemplo prático: a unicidade de um identificador deve ser parcial e aplicar-se apenas a registros não deletados (condição `where deletedAt is null`).
- Assegure-se de alinhar o schema canônico com as ADRs de arquitetura, focando na consistência de tipos e integridade referencial.

## 4. Seeds de Dados
- **Fictícios Apenas:** O script de seed do banco de dados (ex. para ambientes locais e testes) deve conter **apenas** dados fictícios e não comprometedores.

## 5. Banco de Integração
- O ambiente deve suportar testes em DBs de integração com isolamento, garantindo que as operações de teste não impactem dados permanentes e validem corretamente as constraints do banco de dados.

## 6. Limpeza e Refatoração (Cleanup)
- **Schema e Helpers:** Ao atualizar um schema, refatorar um utilitário de banco de dados ou migrar lógicas, faça a limpeza imediata do código obsoleto. Remova helpers ou definições de tabelas que foram substituídas.
