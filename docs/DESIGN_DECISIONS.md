# Decisões de Design e UI (WGOTalent)

## ADR 001: Sistema de Ícones Padrão

### Contexto
Para garantir a consistência visual, performance e facilidade de manutenção na interface da plataforma WGOTalent, foi necessária a definição de um único sistema de ícones padrão para ser utilizado em todo o projeto.

### Decisão
Adotamos o **Lucide React** (`lucide-react`) como a biblioteca de ícones padronizada.

Justificativas:
- Integração padrão e nativa com shadcn/ui (preset Nova) e Tailwind CSS v4.
- Suporte a tree-shaking para manter o tamanho dos bundles otimizado.
- Conjunto abrangente de ícones adequados para interfaces de gestão, RH e triagem.
- Compatibilidade total com React 19 e Server Components do Next.js App Router.

Alternativas consideradas e descartadas:
- `@radix-ui/react-icons`: Conjunto menor de ícones e menor evolução recente.
- `react-icons`: Bundle size potencialmente maior e inconsistências visuais por agrupar múltiplos conjuntos de ícones.

### Consequências
- **Positivas:** Padrão estético único em toda a aplicação, suporte tipado e consistência no uso com componentes do shadcn/ui.
- **Trade-offs:** Desenvolvedores devem utilizar exclusivamente ícones do `lucide-react`, evitando importações de outros pacotes de ícones.
