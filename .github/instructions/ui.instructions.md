---
description: Diretrizes e padrões para UI, Design System, componentes e acessibilidade.
applyTo:
  - src/components/**/*.tsx
  - src/app/**/*.tsx
  - src/styles/globals.css
---

# Instruções de UI e Design

## 1. Princípios Básicos e Referências
- **UI Reference Map**: ANTES de criar ou alterar qualquer superfície, consulte `docs/UI_REFERENCE_MAP.md`. Abra e baseie-se SOMENTE nas referências mapeadas especificamente para a superfície em questão.
- **Regras Globais**: `docs/DESIGN.md` define as regras globais de design do projeto. Siga-as rigorosamente.
- **Fidelidade às Specs**: Imagens, mockups ou screenshots de referência NÃO podem criar novos campos, funcionalidades ou fluxos fora das especificações (specs) oficiais. A spec dita o comportamento e os dados.

## 2. Design System e Componentes
- **shadcn/ui First**: Prefira sempre utilizar e estender os componentes do `shadcn/ui` antes de criar primitivas customizadas do zero.
- **Tokens Semânticos**: Utilize design tokens semânticos e variáveis de CSS configuradas no projeto (ex: `bg-background`, `text-primary`, `border-border`) em vez de cores estáticas (`bg-gray-100`).
- **Composição vs Boolean Props**: Prefira composição de componentes (pattern de Compound Components, children, asChild) ao invés de proliferação de boolean props em um único componente gigante.
- **Sistema de Ícones**: Utilize o sistema de ícones padronizado do projeto (ex: `lucide-react` integrado ao shadcn/ui) garantindo consistência visual.

## 3. Responsividade e Acessibilidade (a11y)
- **Mobile-First**: Construa as interfaces pensando primeiramente na responsividade mobile e escale para desktop através dos breakpoints do Tailwind (`sm:`, `md:`, `lg:`).
- **Acessibilidade**: Todos os componentes interativos devem ser 100% acessíveis (suporte completo a teclado, focus rings explícitos, atributos ARIA, contraste adequado de cores).

## 4. Práticas de Desenvolvimento e Refatoração
- **Auditoria de Superfície (Impeccable)**: Empregue as guidelines do skill "Impeccable" para auditar e garantir excelência nas superfícies: hierarquia visual clara, alinhamentos rigorosos e estados de erro/vazios bem definidos.
- **Limpeza (Cleanup)**: Ao refatorar ou substituir versões de interface, exclua ativamente as versões substituídas e código CSS antigo.
- **Sem Componentes Ociosos**: Não deixe componentes não utilizados acumulando poeira no projeto.
