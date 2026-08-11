# Manifest das Skills do Agente — WGOTalent

Este documento lista todas as skills ativas importadas para o projeto em `.claude/skills/`, detalhando seus objetivos, escopos e cenários recomendados de uso durante o desenvolvimento com GitHub Copilot.

---

## Skills Disponíveis

### 1. `building-components`
- **Nome:** `building-components`
- **Caminho:** `.claude/skills/building-components/`
- **Descrição:** Guia para construção de componentes de UI modernos, acessíveis e composíveis.
- **Uso Recomendado:** Desenvolvimento de novos componentes de interface (primitivos, blocos e templates), implementação de acessibilidade (a11y), APIs composíveis e tokens de design.

### 2. `vercel-composition-patterns` (`composition-patterns`)
- **Nome:** `vercel-composition-patterns`
- **Caminho:** `.claude/skills/composition-patterns/`
- **Descrição:** Padrões de composição React escaláveis desenvolvidos pela Vercel Engineering.
- **Uso Recomendado:** Refatoração de componentes com proliferação de boolean props, criação de compound components, render props e arquitetura de componentes reutilizáveis.

### 3. `impeccable`
- **Nome:** `impeccable`
- **Caminho:** `.claude/skills/impeccable/`
- **Descrição:** Guia e conjunto de ferramentas para design, polimento, crítica, auditoria UX/UI e refinamento estético de interfaces.
- **Uso Recomendado:** Revisões de UX, hierarquia visual, responsividade, microinterações, consistência de espaçamentos e fontes, e refinamento de telas do produto.

### 4. `nextjs-app-router-patterns`
- **Nome:** `nextjs-app-router-patterns`
- **Caminho:** `.claude/skills/nextjs-app-router-patterns/`
- **Descrição:** Padrões avançados para Next.js 14+ App Router, Server Components e estratégias de busca de dados.
- **Uso Recomendado:** Estruturação de rotas, separação de Server e Client Components, Server Actions, Route Handlers e otimizações do App Router.

### 5. `react-best-practices`
- **Nome:** `react-best-practices`
- **Caminho:** `.claude/skills/react-best-practices/`
- **Descrição:** Regras de otimização de performance e boas práticas para React e Next.js mantidas pela Vercel.
- **Uso Recomendado:** Auditorias de performance, prevenção de re-renders desnecessários, otimização de bundles e refatoração de código React/Next.js.

### 6. `shadcn`
- **Nome:** `shadcn`
- **Caminho:** `.claude/skills/shadcn/`
- **Descrição:** Gerenciamento, adição, estilização e composição de componentes baseados em shadcn/ui.
- **Uso Recomendado:** Adição de novos componentes shadcn via CLI, customização de estilos e consulta de documentação de componentes primitivos.

### 7. `tailwind-css-patterns`
- **Nome:** `tailwind-css-patterns`
- **Caminho:** `.claude/skills/tailwind-css-patterns/`
- **Descrição:** Guia de padrões utility-first com Tailwind CSS (v4+), incluindo layouts, grids, flexbox e tipografia.
- **Uso Recomendado:** Estilização utilitária de componentes React, criação de layouts responsivos e suporte a recursos modernos do Tailwind.

### 8. `tailwind-design-system`
- **Nome:** `tailwind-design-system`
- **Caminho:** `.claude/skills/tailwind-design-system/`
- **Descrição:** Padrões para criação e gestão de Design System unindo Tailwind CSS e componentes primitivos shadcn/ui.
- **Uso Recomendado:** Definição e aplicação de design tokens semânticos, temas via variáveis CSS e padronização da linguagem visual.

### 9. `tanstack-form`
- **Nome:** `tanstack-form`
- **Caminho:** `.claude/skills/tanstack-form/`
- **Descrição:** Gerenciamento de estado de formulários headless, performático e fortemente tipado (`@tanstack/react-form`).
- **Uso Recomendado:** Construção de formulários da aplicação, campos dinâmicos em array, validação no borramento/submissão e integração com Zod.

### 10. `zod-validation-utilities`
- **Nome:** `zod-validation-utilities`
- **Caminho:** `.claude/skills/zod-validation-utilities/`
- **Descrição:** Padrões para criação de schemas Zod v4, validação tipada e parse seguro de dados.
- **Uso Recomendado:** Construção da camada de validação de formulários, boundaries de Server Actions, payloads de webhooks e modelos de domínio.
