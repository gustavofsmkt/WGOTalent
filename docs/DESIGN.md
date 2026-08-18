# WGOTalent Design System

Este documento define as regras, tokens e padrões visuais do WGOTalent, com base nas referências visuais aprovadas. O WGOTalent é uma plataforma voltada para profissionais de Recursos Humanos e Operações (Modo: Operate), devendo transmitir profissionalismo, clareza e eficiência.

## 1. Personalidade Visual
- **Clareza e Foco**: A interface não deve competir com a tarefa; conteúdo e dados de candidatos e vagas são os protagonistas.
- **Profissionalismo e Confiança**: Tons sóbrios com acentos vibrantes e consistentes para destacar pontos de ação e status.
- **Eficiência e Produtividade**: Densidade ajustada para leitura rápida de listagens sem sobrecarregar cognitivamente (whitespace generoso em detalhes, alinhamento rigoroso em tabelas).

## 2. Tipografia
- **Font-Family Base**: `Inter` (sans-serif) para legibilidade ideal em tabelas, dashboards e forms.
- **Hierarquia Tipográfica**:
  - `Display / H1`: `text-2xl` a `text-3xl`, `font-semibold`, tracking ajustado (tight) — Títulos de páginas.
  - `H2 / Section Title`: `text-lg` a `text-xl`, `font-semibold` — Títulos de cards e blocos de dados.
  - `Body`: `text-sm` (padrão) para listagens, labels e inputs; `text-base` apenas para blocos densos de leitura textual (ex: currículos longos).
  - `Small / Muted`: `text-xs`, `text-muted-foreground` para metadados, dicas de form e timestamps.

## 3. Tokens Semânticos (Tailwind & shadcn)
O design estenderá o sistema de variáveis CSS padrão do shadcn/ui.
- **Backgrounds**: `bg-background` (branco/claro puro) para conteúdo principal; `bg-muted` ou cinza claríssimo (`zinc-50`/`slate-50`) para o Shell/Sidebar e backgrounds de seção para delimitação visual.
- **Brand / Primary**: Tons de azul ou roxo sóbrio (`bg-primary`). Aplicado nos botões principais, estados ativos de navegação e destaques de IA.
- **Ações e Alertas**:
  - *Destructive / Danger*: Vermelho (ex: reprovar, remover, erros).
  - *Warning / Alert*: Laranja ou Dourado (ex: alertas de IA pendentes, banco de talentos).
  - *Success*: Verde (ex: candidato aprovado, vaga ativa).
  - *Muted*: Cinza/Neutro (ex: rascunhos, inativos).

## 4. App Shell e Layout
- **ApplicationShell**: Sidebar fixo à esquerda para navegação primária (com ícones em coluna ou lista, dependendo do state expansível). A área de conteúdo ocupa o resto da viewport e rola de forma independente.
- **Max-width**: Páginas de detalhes e formulários devem ser contidas (ex: `max-w-5xl` a `max-w-7xl`) e centralizadas (`mx-auto`) em telas ultrawide para não alongar excessivamente linhas de leitura.
- **Page Header**: Presente no topo do conteúdo com o título da página à esquerda e Call to Actions principais (ex: Novo Candidato) alinhados à direita.

## 5. Densidade, Bordas e Espaçamentos
- **Bordas e Radius**: `rounded-lg` ou `rounded-xl` para bordas de modais, cards e formulários. Contornos sutis (`border-border`).
- **Shadows**: Sombra muito leve (`shadow-sm`) em cards brancos sobre fundo off-white. Elevação maior (`shadow-md`) em modais e popovers.
- **Espaçamento**: Gaps estruturados (ex: `gap-6` entre seções de detalhe, `gap-4` para clusters de botões).

## 6. Padrões e Componentes Compartilhados
- **MetricCard**: Para o Dashboard. Card com valor numérico grande, subtítulo descritivo, ícone no canto superior direito e indicador de tendência.
- **FilterBar**: Container flexível acima das listas. Campo de busca contendo lupa interna alinhado à esquerda; ações adicionais e botões de filtro (`DropdownMenu` ou `Select`) à direita.
- **DataTable**: Estrutura de tabela onde apenas o cabeçalho possui um leve fundo ou as linhas possuem borda separadora (`border-b`). Botões de ação contextual na última coluna.
- **EntityDetail**: O padrão principal de leitura (ex: Vagas, Candidatos). Título e ações no topo; conteúdo abaixo dividido em grid (ex: `md:grid-cols-3`), onde 2 colunas exibem histórico/textos e 1 coluna funciona como um painel lateral de propriedades e metadados.
- **EntityForm**: Envelopado visualmente da mesma maneira que `EntityDetail` (Cards agrupadores), suportando Field e FieldGroups. Erros de validação exibidos em vermelho sutil logo abaixo do respectivo `Input`.
- **KanbanBoard**: Para o pipeline de Triagem. Ocupa largura total com `overflow-x-auto`. Colunas semânticas mapeadas pelo enum `etapa`. Cartões (Cards mínimos) com o nome e badges de status.
- **StatusBadge**: Variantes customizadas para mapear os enum do banco de dados (ex: `resultado` e `status`).

## 7. Estados do Sistema: Empty, Loading e Error
- **Empty States**: Aplicado em listas vazias e estados sem dados de uma tabela. Consiste num contêiner espaçoso com fundo neutro (`bg-muted/50`), ícone opaco (`text-muted-foreground`), título, mensagem explicativa e botão CTA principal para adicionar um novo registro.
- **Loading**: Transições não-bloqueantes com `Skeleton` seguindo aproximadamente a mancha gráfica final do conteúdo (esqueleto de tabela, esqueleto de cartão).
- **Error / Feedback**: Formulários utilizam alertas inline; exceções da página usam o componente de erro com ação clara para recarregar ou voltar. Notificações globais (`toast`) reservadas para confirmação de ações de sucesso ou falhas em Server Actions.

## 8. Acessibilidade e Mobile/Responsive
- **Acessibilidade**: Contrastes aderentes a AA, labels e descrições para todos os campos (mesmo que com `sr-only`), outlines de foco explícitos (`focus-visible:ring`) e hierarquia DOM estruturada.
- **Mobile-First**:
  - O Sidebar deve colapsar em um menu hambúrguer (`Sheet` ou drawer) em dispositivos menores que `md`.
  - Tabelas de dados ganham wrapper de overflow (`overflow-x-auto`) ou, no caso de detalhes densos, convertem-se numa visualização de cards verticais.
  - Formulários de múltiplas colunas passam para layout em 1 coluna (`flex-col`) em telas menores.

## 9. Adaptações de Requisitos (Specs > Visual)
Se um modelo de referência apresentar componentes ou campos não suportados pelo Schema ou Specs, as Specs vencem:
- Formulários referenciados sem os enums exatos devem ser mapeados de volta aos enum do banco (ex: Motivo em reprovação condicionado ao resultado).
- Faixas salariais em referências que mostrem intervalos de valores devem ser mostradas como valor único, conforme a tipagem `numeric` da Vaga.
- Avaliações de IA mostram os 4 blocos de feedback de forma legível em texto (mesmo se a referência usar visual de "tags").
