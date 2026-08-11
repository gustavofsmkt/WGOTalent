---
description: Verifica o fluxo correto do Drizzle ORM (schema-first), geração de migrações e validação antes da aplicação.
---
# Drizzle Migration Check

Use esta skill ao criar ou modificar schemas do banco de dados e aplicar migrações.

## Regras e Verificações
1. **Fluxo Schema-first**: Sempre altere o schema (`src/server/db/schema.ts` ou arquivos modulares equivalentes) primeiro.
2. **Geração e Revisão**: 
   - Execute `generate` para criar o SQL da migração.
   - **Revise** o arquivo SQL gerado para evitar perdas acidentais de dados.
   - Apenas aplique (`migrate`) após revisão.
3. **Estrutura Intocável**: Não modifique a estrutura base do `src/server/db/index.ts` e `src/env.js`.

Consulte `.github/instructions/database.instructions.md` para diretrizes de banco de dados.
