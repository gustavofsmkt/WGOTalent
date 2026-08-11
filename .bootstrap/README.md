# Bootstrap temporário — WGOTalent greenfield

Este diretório existe apenas para as primeiras TASKs do roteiro.

Conteúdo:
- `db_triagem_proposta.ts` — especificação canônica do modelo de dados.
- `hr-platform-nextjs-architecture-prompt.md` — especificação canônica de arquitetura.
- `claude-skills/` — skills fornecidas pelo usuário.

A TASK de importação deve:
1. mover as specs para `docs/specs/`;
2. mover `claude-skills/*` para `.claude/skills/`, preservando todos os arquivos;
3. criar um manifesto versionado das skills;
4. remover `.bootstrap/` por completo.

Não manter cópias duplicadas.
