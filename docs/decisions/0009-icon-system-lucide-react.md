# 9. Sistema de Ícones Padrão

## Status

Aceita

## Contexto

Para garantir consistência visual, performance e facilidade de manutenção na interface do WGOTalent, foi necessário definir um único sistema de ícones padrão para uso em todo o projeto.

## Decisão

Adotamos o **Lucide React** (`lucide-react`) como a biblioteca de ícones padronizada.

Justificativas:
- Integração padrão e nativa com shadcn/ui (preset Nova) e Tailwind CSS v4.
- Suporte a tree-shaking para manter o tamanho dos bundles otimizado.
- Conjunto abrangente de ícones adequados para interfaces de gestão, RH e triagem.
- Compatibilidade total com React 19 e Server Components do Next.js App Router.

## Consequências

- **Positivas:** Padrão estético único em toda a aplicação, suporte tipado e consistência no uso com componentes do shadcn/ui.
- **Trade-offs:** Desenvolvedores devem utilizar exclusivamente ícones do `lucide-react`, evitando importações de outros pacotes de ícones.

## Alternativas

- `@radix-ui/react-icons`: conjunto menor de ícones e menor evolução recente.
- `react-icons`: bundle size potencialmente maior e inconsistências visuais por agrupar múltiplos conjuntos de ícones.
