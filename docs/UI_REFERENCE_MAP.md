# UI Reference Map

Use este mapa rápido para abrir **apenas as referências estritamente necessárias** durante o desenvolvimento das páginas.

| Superfície (Tela) | Arquivo de Referência (.html / .png) | Padrão Visual Principal | Observações e Adaptações |
|-------------------|---------------------------------------|-------------------------|--------------------------|
| **Dashboard** | `docs/references/ui/dashboard/dashboard.*` | `MetricCard` | KPIs gerais. Ajuste métricas conforme banco real. |
| **Departamentos** (Lista) | `docs/references/ui/departamentos/listagem.*` | `FilterBar`, `DataTable` | |
| **Departamentos** (Detalhe) | `docs/references/ui/departamentos/detalhes.*` | `EntityDetail` | |
| **Cargos** (Lista) | `docs/references/ui/cargos/listagem.*` | `FilterBar`, `DataTable` | Ignorar coluna "Código" no mockup. |
| **Cargos** (Detalhe) | `docs/references/ui/cargos/detalhes.*` | `EntityDetail` | A faixa salarial é apenas um valor único (`NUMERIC`), não um intervalo. |
| **Vagas** (Lista) | `docs/references/ui/vagas/listagem.*` | `FilterBar`, `DataTable` | Ignorar barra de progresso de "posições preenchidas". |
| **Vagas** (Detalhe) | `docs/references/ui/vagas/detalhes.*` | `EntityDetail` | |
| **Candidatos** (Lista) | `docs/references/ui/candidatos/listagem.*` | `FilterBar`, `DataTable` | Respeitar `origem` enum (`email | manual | indicacao`). |
| **Candidatos** (Detalhe) | `docs/references/ui/candidatos/detalhes.*` | `EntityDetail` | |
| **Triagens** (Pipeline) | `docs/references/ui/triagens/kanban.*` | `KanbanBoard` | Use colunas baseadas em `etapa` e ignore status fictícios. |
| **Triagens** (Detalhe) | `docs/references/ui/triagens/detalhes.*` | `EntityDetail` | O stepper deve seguir exatamente a ordem do enum `etapa`. |
| **Formulários (Geral)** | *(Sem referência dedicada)* | `EntityDetail` + `Form` | Utilize o card de detalhe como envelope para os campos shadcn. |

**Nota**: Utilize preferencialmente a imagem (.png) para composição e o HTML (.html) para referência de layout de Flexbox/Grid e espaçamentos (gap/padding).
