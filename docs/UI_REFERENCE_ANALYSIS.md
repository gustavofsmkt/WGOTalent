# Análise de Referências de UI

Este documento contém a análise detalhada das referências visuais em `docs/references/ui/`, extraindo a linguagem visual e os padrões de layout para implementação no WGOTalent usando shadcn/ui e Tailwind CSS.

## 1. Inventário de Referências

Todas as referências estão em `docs/references/ui/` e são compostas por capturas de tela (`.png`) e código HTML (`.html`). Todas têm relevância Alta para o MVP e cobrem interfaces Desktop.

- **Candidatos**
  - `candidatos/listagem`: Tabela de candidatos.
  - `candidatos/detalhes`: Perfil do candidato com histórico e currículo.
- **Cargos**
  - `cargos/listagem`: Tabela de cargos da empresa.
  - `cargos/detalhes`: Detalhes do cargo, requisitos e informações salariais.
- **Dashboard**
  - `dashboard/dashboard`: Visão geral com cards de métricas (KPIs).
- **Departamentos**
  - `departamentos/listagem`: Tabela de departamentos.
  - `departamentos/detalhes`: Visão do departamento e equipe.
- **Triagens**
  - `triagens/kanban`: Pipeline de triagem em formato Kanban (por etapa).
  - `triagens/detalhes`: Tela detalhada da triagem de um candidato para uma vaga.
- **Vagas**
  - `vagas/listagem`: Tabela de vagas abertas.
  - `vagas/detalhes`: Informações da vaga, status e candidatos associados.

*(Nenhuma referência foi considerada fora de escopo ou duplicada desnecessária, visto que cobrem exatamente o fluxo do MVP).*

## 2. Linguagem Visual e Estilo

- **App Shell:** Sidebar fixo à esquerda com fundo escuro (cor primária), links de navegação com ícones. O conteúdo principal fica à direita, ocupando o restante da tela, com fundo claro.
- **Cores:** Paleta baseada em tons de azul e roxo para elementos primários (Brand/Surface), laranja/dourado para secundários (Ações/Alertas). O esquema de cores exato será gerido pelos Design Tokens adaptados para Tailwind, não sendo necessário copiar os HEX exatos do HTML exportado, mas sim mapear para CSS Variables (`hsl`).
- **Tipografia:** Uso da fonte `Inter`. Hierarquia clara com títulos grandes (`display`, `headline`) e textos de corpo legíveis.
- **Espaçamento e Densidade:** Layouts espaçosos (margins e paddings generosos, ex: `p-lg`, `gap-md`). Densidade média-baixa para favorecer leitura.
- **Bordas e Sombras:** Cards e botões possuem bordas arredondadas (radius `lg`, `xl` ou `2xl`). Uso leve de shadows (`shadow-sm` a `shadow-md`) para destacar painéis de fundo e cards flutuantes.
- **Responsividade:** Embora as referências sejam primariamente desktop, o sistema de grid (ex: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`) indica comportamento fluido que deve ser reproduzido com breakpoints do Tailwind.

## 3. Padrões Recorrentes e Componentização

Abaixo estão os padrões extraídos das referências e como devem ser implementados com shadcn/ui:

| Padrão (Conceito) | Descrição do Layout | Componentes shadcn sugeridos | Necessidade Componente Custom WGOTalent |
|-------------------|---------------------|------------------------------|-----------------------------------------|
| **ApplicationShell** | Sidebar lateral de navegação e área de conteúdo principal à direita. | `Sheet` (mobile), nenhum (desktop) | `AppSidebar`, `AppLayout` |
| **PageHeader** | Título principal à esquerda, descrição opcional, botão de "Novo" à direita. | `Button` | `PageHeader` (wrapper semântico) |
| **MetricCard** | Card com número grande, ícone de contexto, e indicador de tendência. Encontrado no Dashboard. | `Card` | `MetricCard` |
| **FilterBar** | Barra com campo de busca à esquerda (com ícone) e botões de filtro à direita. | `Input`, `Button`, `DropdownMenu` | `FilterBar` (agrega formulário de busca) |
| **DataTable** | Tabela estruturada para listagens com cabeçalhos e ações (editar/excluir) na última coluna. | `Table`, `DropdownMenu`, `Button` (icon) | `DataTable` ou wrapper de Tabela |
| **EntityDetail** | Layout de página de detalhes. Geralmente um cabeçalho proeminente e conteúdo dividido em grids (ex: 2/3 info, 1/3 sidebar de metadados). | `Card`, `Separator` | `DetailSection` |
| **StatusBadge** | Indicador visual de estado (Ativo, Em Andamento, Inativo). | `Badge` | Nenhuma, apenas variação de `Badge` |
| **KanbanBoard** | Colunas representando etapas, com cards empilhados. | `Card`, `ScrollArea` | `KanbanColumn`, `KanbanCard` |

## 4. Mapa Referência -> Tela WGOTalent

| Referência | Rota / Tela WGOTalent |
|------------|-----------------------|
| `dashboard/dashboard` | `/` (Dashboard / Home) |
| `departamentos/listagem` | `/departamentos` (Lista) |
| `departamentos/detalhes` | `/departamentos/[id]` (Detalhes e Formulário) |
| `cargos/listagem` | `/cargos` (Lista) |
| `cargos/detalhes` | `/cargos/[id]` (Detalhes e Formulário) |
| `vagas/listagem` | `/vagas` (Lista) |
| `vagas/detalhes` | `/vagas/[id]` (Detalhes e Formulário) |
| `candidatos/listagem` | `/candidatos` (Lista) |
| `candidatos/detalhes` | `/candidatos/[id]` (Detalhes e Formulário) |
| `triagens/kanban` | `/triagens` (Board/Pipeline) |
| `triagens/detalhes` | `/triagens/[id]` (Avaliação/Screening) |

## 5. Divergências e Adaptações (Regras de Consistência)

Ao implementar, as seguintes regras superam a aparência visual das referências:

1. **Campos Inexistentes**: Se a UI mostra um campo que não está no schema do Drizzle (ex: "Código" em Cargos), o banco de dados e as especificações de negócio prevalecem. Não crie o campo na UI.
2. **Triagens Kanban**: As tags e botões nos mockups podem diferir dos enums reais do banco. Use estritamente o enum `resultado` (`em_andamento`, `aprovado`, `reprovado`, `desistente`, `banco_talentos`) e `etapa` definidos em `schema.ts`.
3. **Faixa Salarial**: A referência visual mostra um intervalo ("R$ X - R$ Y"). O schema do banco possui apenas um valor (`NUMERIC`). Adapte a UI para exibir o valor único oferecido, preservando a coerência com o backend.
4. **Formulários**: As referências não incluem os formulários de criação/edição. Os formulários devem seguir o layout de `DetailSection` mas adaptados usando `Form` (react-hook-form + shadcn) e `Input`/`Select`, mantendo o mesmo espaçamento e tipografia das listagens e detalhes.
