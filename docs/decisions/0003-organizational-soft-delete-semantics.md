# ADR 0003: Semântica de Soft Delete Organizacional

## Contexto
O sistema possui entidades organizacionais hierárquicas: Departamentos contêm Cargos, que por sua vez contêm Vagas. O sistema aplica o padrão de Soft Delete (deleção lógica via `deleted_at`) em todas as tabelas. Precisamos definir como o soft delete se comporta em casos onde existem dependências ativas nestas hierarquias. É preciso assegurar a integridade estrutural, impedindo que registros superiores sejam inativados caso existam registros dependentes ainda em uso. Adicionalmente, precisamos definir os efeitos do soft delete de uma Vaga sobre as Triagens relacionadas, bem como a apresentação destas referências na interface (UI).

## Decisão
1. **Restrição de Deleção Hierárquica:**
   - Será **bloqueado** o soft delete de um `Departamento` caso o mesmo possua um ou mais `Cargos` ativos.
   - Será **bloqueado** o soft delete de um `Cargo` caso o mesmo possua uma ou mais `Vagas` ativas.
2. **Preservação Histórica:**
   - O soft delete de uma `Vaga` **não apaga** as `Triagens` históricas relacionadas a ela. As avaliações de candidatos realizadas para a vaga continuam mantidas no histórico.
3. **Comportamento na Interface de Usuário:**
   - Listagens, tabelas e listas de seleção (dropdowns/comboboxes) devem sempre **esconder** os itens que sofreram soft delete.
   - Páginas de detalhes históricos (ex: visualização de uma Triagem) devem **hidratar e exibir** referências a registros já deletados (ex: mostrando o nome da Vaga, Cargo ou Departamento passados) apenas quando estritamente necessário para manter o entendimento do contexto histórico.

## Consequências
- **Positivas:**
  - Prevenção contra a inativação acidental de departamentos e cargos que estão atualmente em uso, garantindo a consistência do sistema.
  - Manutenção de registros históricos completos (Triagens e Candidaturas), crucial para análises e auditoria.
  - Interface mais limpa e à prova de falhas ao ocultar dados antigos de menus de seleção.
- **Trade-offs / Riscos:**
  - O usuário deverá inativar todos os filhos (ex: todas as Vagas e depois os Cargos) antes de conseguir inativar um nível superior (Departamento).
  - A lógica das Server Actions exigirá verificações extras de bloqueio ("pré-flight checks") no banco de dados antes da marcação da coluna `deleted_at`.
  - As queries de detalhamento terão que flexibilizar pontualmente cláusulas `notDeleted()` (ou ignorá-las nos `JOINs`) quando precisarem carregar relações apenas para efeito de leitura do contexto histórico.
