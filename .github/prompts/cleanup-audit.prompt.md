---
description: Executa uma auditoria completa de limpeza (cleanup) na base de código.
---
Execute uma auditoria de cleanup no projeto (foco em: "${input:Diretório, arquivo ou 'todo o projeto'}").

Procure especificamente por:
- Arquivos órfãos (não importados em nenhum lugar).
- Imports não utilizados.
- Exports não utilizados.
- Dependências não utilizadas no `package.json`.
- Rotas mortas ou inacessíveis.
- Componentes UI não utilizados.

Liste os problemas encontrados e proponha/execute a remoção de cada um de forma segura.
