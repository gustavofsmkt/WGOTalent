---
description: Verifica o fluxo correto do Drizzle ORM (schema-first), geração de migrações e validação antes da aplicação.
---
# Drizzle Migration Check

Use esta skill ao criar ou modificar schemas do banco de dados e aplicar migrações.

## Regras e Verificações
1. **Fluxo Schema-first**: Sempre altere o schema (`src/server/db/schema.ts` ou arquivos modulares equivalentes) primeiro.
2. **Geração e Revisão**: 
   - Execute `generate` **sempre com nome descritivo explícito**: `npm run db:generate -- --name=<verbo>_<entidade>` (ex.: `create_cargos`, `add_status_vagas`, `drop_x`). Nunca aceite o nome aleatório gerado automaticamente pelo Drizzle Kit (ex.: `sour_revanche`, `worried_vision`) — ele não comunica o que a migração faz.
   - Convenção de nome: `snake_case`, iniciando com verbo (`create_`, `add_`, `alter_`, `drop_`, `rename_`) seguido da entidade/coluna afetada.
   - **Revise** o arquivo SQL gerado para evitar perdas acidentais de dados.
   - Apenas aplique (`migrate`) após revisão.
3. **Estrutura Intocável**: Não modifique a estrutura base do `src/server/db/index.ts` e `src/env.js`.

Consulte `.github/instructions/database.instructions.md` para diretrizes de banco de dados.

**Nota:** As regras canônicas de soft delete, repositório e unique constraints estão documentadas em `.claude/skills/layer-db/SKILL.md`.
