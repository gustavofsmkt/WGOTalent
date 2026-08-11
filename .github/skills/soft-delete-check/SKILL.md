---
description: Valida a implementação e o uso do padrão Soft Delete em todas as entidades e consultas do sistema.
---
# Soft Delete Check

Use esta skill para garantir a exclusão lógica em todo o sistema WGOTalent.

## Regras e Verificações
1. **Soft Delete Global**: NUNCA remova registros fisicamente do banco de dados. Todas as entidades principais devem possuir o campo `deletedAt`.
2. **Cascade Via Aplicação**: A exclusão lógica de uma entidade pai (ex: Candidato) exige exclusão em cascata em suas dependências via aplicação (código TypeScript), e não via constraint de banco.
3. **Queries de Leitura Seguras**: Verifique se TODAS as queries de leitura incluem restrição ignorando registros deletados (`notDeleted` / `deletedAt is null`).

Consulte `.github/instructions/database.instructions.md`.
