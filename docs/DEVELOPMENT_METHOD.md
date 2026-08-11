# Método de Desenvolvimento

Este documento define o fluxo de trabalho e as regras padronizadas para o desenvolvimento utilizando agentes de IA neste projeto.

## O Fluxo

O ciclo de desenvolvimento deve seguir rigorosamente as etapas abaixo:

1. **ESPECIFICAR**
   - Definir de forma clara o que precisa ser feito.
   - **Regra**: Uma TASK por conversa.
   - **Regra**: Fornecer contexto mínimo necessário para evitar ruído.

2. **PLANEJAR**
   - Estruturar a abordagem antes de iniciar a codificação.
   - **Regra**: Utilizar skills mínimas necessárias para a tarefa.
   - **Regra**: Elaborar planos claros para mudanças transversais (que afetem múltiplos módulos ou componentes).

3. **IMPLEMENTAR**
   - Escrever o código seguindo a arquitetura e o planejamento.

4. **VALIDAR**
   - Garantir que a solução funciona corretamente.
   - **Regra**: Escrever e executar testes automatizados sempre que aplicável.

5. **REVISAR**
   - Validar a implementação em relação à especificação e às regras de negócio.

6. **EXPLICAR**
   - Documentar ou relatar de forma sucinta como o problema foi resolvido.

7. **REGISTRAR**
   - Salvar o estado do projeto e o conhecimento gerado.
   - **Regra**: Fazer commits atômicos (focados em uma única mudança lógica).
   - **Regra**: Atualizar as pastas de documentação (`docs/`), garantindo que os docs funcionem como **memória persistente** do projeto.

8. **LIMPAR**
   - Garantir a higiene do repositório.
   - **Regra**: Regra de substituição + cleanup (remover código obsoleto, dependências não utilizadas e limpar artefatos antigos substituídos pela nova implementação).
