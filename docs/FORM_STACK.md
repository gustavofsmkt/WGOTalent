# Stack de Formulários e Validação (WGOTalent)

Este documento consolida as definições, versões e padrões de integração da stack de formulários e validação do projeto WGOTalent.

## 1. Visão Geral da Stack

- **Gerenciamento de Formulários (Client UX):** `@tanstack/react-form` (`^1.33.5`)
- **Schema e Validação:** `zod` (`^3.24.2`)
- **Padrão de Validação:** Standard Schema nativo (`~standard`)
- **Componentes de UI:** `shadcn/ui` com Tailwind CSS v4

---

## 2. Decisões Arquiteturais e Padrões Escolhidos

### 2.1 Preservação e Consolidação do Zod (v3.24.2)
- O Zod versão `3.24.0+` implementa nativamente o protocolo **Standard Schema** (`~standard`), eliminando a necessidade de pacotes adaptadores adicionais (como `@tanstack/zod-form-adapter`).
- Mantivemos o pacote `zod` existente (`3.24.2`) como a **única fonte da verdade** para definições de schema no projeto, sem criar duplicidades de validadores ou instâncias secundárias.

### 2.2 Adição do `@tanstack/react-form`
- Utilizado para gerenciar o estado reativo dos formulários no lado do cliente, oferecendo performance granular via *subscriptions*, controle de re-renders e validação nos eventos `onChange`, `onBlur` ou `onSubmit`.
- O React Hook Form foi descartado para manter consistência com o ecossistema TanStack e suporte nativo ao Standard Schema.

### 2.3 Integração com Next.js Server Actions
- As submissões de formulário são gerenciadas no client pelo TanStack Form e delegadas diretamente para **Server Actions** do Next.js (`'use server'`).
- Devido a este fluxo simples e direto de Server Actions assíncronas, o pacote `@tanstack/react-form-nextjs` não foi instalado, evitando complexidades desnecessárias no bundle e no fluxo de reidratação.

### 2.4 Fronteira de Segurança e Reuso de Schemas
- **Client (UX):** O TanStack Form executa o schema Zod via Standard Schema para feedback instantâneo de interface ao usuário.
- **Server (Security Boundary):** A Server Action re-valida rigorosamente o payload recebido com o mesmo schema Zod antes de qualquer mutação no banco de dados (Drizzle ORM).

---

## 3. Padrão de Implementação Exemplo

```tsx
'use client';

import { useForm } from '@tanstack/react-form';
import { z } from 'zod';

// 1. Schema Zod compartilhado (Standard Schema)
export const candidateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
});

export type CandidateInput = z.infer<typeof candidateSchema>;

interface CandidateFormProps {
  onSubmitAction: (data: CandidateInput) => Promise<void>;
}

export function CandidateForm({ onSubmitAction }: CandidateFormProps) {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
    },
    validators: {
      onChange: candidateSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmitAction(value);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div>
            <label htmlFor={field.name}>Nome</label>
            <input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.map((error, i) => (
              <span key={i}>{error?.message ?? String(error)}</span>
            ))}
          </div>
        )}
      </form.Field>

      <button type="submit">Salvar Candidate</button>
    </form>
  );
}
```
