---
description: Procura proativamente por sujeira no repositório, dependências órfãs e lixo de refatorações.
---
# Repository Cleanliness Check

Use esta skill para garantir a higiene do código durante e após refatorações. "Substituição implica Cleanup".

## Checklist de Inspeção Proativa
Busque ativamente e remova:
1. **Arquivos sem referência**: Código órfão ou *dead code*.
2. **Fontes duplicadas**: Lógica ou código repetido.
3. **Dependências não usadas**: Bibliotecas no `package.json` sem uso real.
4. **Rotas antigas**: Diretórios no App Router (`src/app/`) que caíram em desuso.
5. **Componentes substituídos**: Componentes React de legado após migrações de UI.
6. **TODOs de migração**: Comentários `// TODO:` antigos e já resolvidos.

Consulte `docs/DEVELOPMENT_METHOD.md` para a cultura de cleanup contínuo.
