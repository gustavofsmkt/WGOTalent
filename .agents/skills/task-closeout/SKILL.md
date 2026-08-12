---
description: Roteiro final para fechamento de task garantindo cleanup, documentação e segurança.
---
# Task Closeout

Use esta skill imediatamente antes de declarar uma task finalizada ou realizar commits de conclusão.

## Checklist de Fechamento
1. **Cleanup Realizado**: Código obsoleto decorrente da task foi apagado? O *Repository Cleanliness Check* foi avaliado?
2. **Segredos e Credenciais**: Verifique se NENHUM token, chave ou segredo foi inserido/commitado no código.
3. **Testes**: A cobertura exigida de testes automatizados foi mantida/atualizada?
4. **Atualização da Fonte de Verdade**: Se a task mudou arquitetura, rotas ou esquemas, isso foi refletido nos ADRs, `docs/PROJECT_STATE.md` e specs?
5. **Contexto Estrito**: O escopo da tarefa foi estritamente obedecido sem introduzir refatorações globais indesejadas?

Consulte `docs/PRODUCT.md`, `docs/ARCHITECTURE.md` e `.github/instructions/docs.instructions.md`.
