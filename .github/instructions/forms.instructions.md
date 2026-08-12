---
applyTo:
  - "src/components/**/*form*.tsx"
  - "src/lib/validation/**"
  - "src/app/**"
---

# Instruções de Formulários (WGOTalent)

Diretrizes para a criação, validação e manutenção de formulários.

## 1. Stack de Formulários
- **TanStack Form**: Gerenciamento de estado, ciclo de vida e UX no frontend.
- **Zod (v4)**: Definição de schemas e validação (client e server).
- **shadcn/ui**: Componentes de interface.

## 2. Validação e Segurança
- **Verificação de Adapters**: Sempre confira a documentação da versão instalada (TanStack Form e Zod) antes de adicionar adapters de terceiros.
- **Standard Schema**: Dê preferência ao Standard Schema para máxima compatibilidade e padronização.
- **Responsabilidades**:
  - TanStack Form atua na experiência do usuário e estado local (UX).
  - O Zod no lado do servidor é a barreira de segurança (Security Boundary).
- **Schemas Client/Server**: O schema do servidor (`src/lib/validation/<entity>.ts`, derivado via `createInsertSchema` do `drizzle-orm/zod`) é a fonte de verdade. Para formulários no cliente, crie `src/lib/validation/<entity>.client.ts` estendendo o schema do servidor via `.extend()` para adicionar mensagens em português e ajustes de UX. O schema do servidor re-valida de forma independente no Server Action — a regra de negócio nunca depende apenas do schema do cliente.
- Consulte o skill [`tanstack-form`](../../.claude/skills/tanstack-form/SKILL.md) para os padrões de integração com Standard Schema.
- **Triagem e Invariantes**: Use o `superRefine` do Zod para implementar validações de invariantes de negócio mais complexas (como as regras de negócio de Triagem que envolvem múltiplos campos).

## 3. Experiência de Usuário e Performance (UI/UX)
- **Componentes Base**: Utilize os wrappers do shadcn (ex: `Field`, `FieldGroup`, `FormItem`, `FormMessage`) quando disponíveis.
- **Erros e Acessibilidade**: Certifique-se de que os erros sejam acessíveis (usando atributos como `aria-describedby`).
- **Feedback**: Configure as validações para engatilhar no `onBlur` ou `onChange` estratégico, proporcionando um feedback rápido sem ruído.
- **Subscriptions**: Para formulários extensos, faça uso de *subscriptions* granulares do TanStack Form para otimizar re-renders.

## 4. Refatoração e Limpeza
- **Sem Legados**: Ao refatorar ou substituir lógicas de formulários ou helpers antigos, remova o código antigo (cleanup).
