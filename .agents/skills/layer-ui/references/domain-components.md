# DomainComponents

React components that support the entity pages. Entity-specific components (the
candidatos table, the vagas form) live in a `_components/` folder inside their
route segment. Shared base primitives that multiple routes build on (a styled
DataTable, a FormCard wrapper) live in `src/components/domain/`.

## Responsibilities

Render entity-specific form fields, display entity data in tables, and provide
styled base primitives that give all forms and tables a consistent look. Entity-
specific components receive data and Server Action bindings as props. Base
primitives wrap shadcn components with project-wide Tailwind styles.

Not responsible for: fetching data (→ RHPages), mutation logic (→ layer-actions),
or domain display wrappers like badges (→ SharedUIComponents).

### Where does it live?

**Entity-specific — co-located in `_components/` inside the route segment:**
```
src/app/(rh)/
  candidatos/
    page.tsx
    _components/
      table.tsx        # candidatos list table — only used by this page
      form.tsx         # candidatos create form — only used by this page
  candidatos/[id]/
    page.tsx
    _components/
      edit-form.tsx    # candidatos edit form — only used by this page
  triagens/
    page.tsx
    _components/
      pipeline-table.tsx
  triagens/[id]/
    page.tsx
    _components/
      detail-card.tsx
  # same pattern for departamentos/, cargos/, vagas/
```

**Shared base primitives — promoted to `src/components/domain/` when used by 2+ routes:**
```
components/domain/
  data-table.tsx      # styled DataTable used by all entity tables
  form-card.tsx       # styled card wrapper used by all entity forms
  # other base primitives as they emerge
```

### Building blocks

No sub-artifacts. Related: [SharedUIComponents](shared-ui-components.md).

### Structural convention

Entity-specific component (stays in route `_components/`):
```tsx
// src/app/(rh)/triagens/[id]/_components/edit-form.tsx
'use client';
import { useState } from 'react';
import { FormCard } from '~/components/domain/form-card'; // base primitive

const MOTIVO_REPROVADO = ['curriculo', 'fit_cultural', 'testes', 'rh', 'gestor'] as const;
const MOTIVO_DESISTENTE = [
  'incompatibilidade_salarial', 'aceitou_outra_proposta',
  'nao_atendeu_contato', 'motivos_pessoais',
] as const;

type Resultado = 'em_andamento' | 'aprovado' | 'reprovado' | 'desistente' | 'banco_talentos';

export function EditTriagemForm({ action }: { action: (fd: FormData) => Promise<unknown> }) {
  const [resultado, setResultado] = useState<Resultado>('em_andamento');
  const motivoOptions =
    resultado === 'reprovado' ? MOTIVO_REPROVADO :
    resultado === 'desistente' ? MOTIVO_DESISTENTE : [];

  return (
    <FormCard>
      <form action={action}>
        <select name="resultado" onChange={e => setResultado(e.target.value as Resultado)}>
          {/* options */}
        </select>
        {motivoOptions.length > 0 && (
          <select name="motivo">
            {motivoOptions.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        )}
      </form>
    </FormCard>
  );
}
```

Shared base primitive (lives in `src/components/domain/`):
```tsx
// components/domain/form-card.tsx
import { Card, CardContent } from '~/components/ui/card'; // shadcn source
import { cn } from '~/lib/utils';

export function FormCard({ className, children }: React.PropsWithChildren<{ className?: string }>) {
  return (
    <Card className={cn('max-w-2xl', className)}>
      <CardContent className="pt-6">{children}</CardContent>
    </Card>
  );
}
```

### Hard rules

- Default to creating new components in `_components/` inside the route segment. Move to `src/components/domain/` only when a second route imports the same component.
- `src/components/domain/` holds base primitives (DataTable, FormCard, InputField) — not entity-specific components. An entity-specific component that happens to look the same in two places should be made into a base primitive first, then extended.
- Never touch files under `src/components/ui/` — that is the shadcn source directory.
- The `TriagemForm` must show `motivo` only when `resultado` is `reprovado` or `desistente`, with only the matching subset of values.
- FK option lists must be received as props from the parent Server Component — never fetched client-side.
- Server Actions must be received as `action` props — never imported directly inside Client Components.

---

## Workflow

1. Create the component in `src/app/(rh)/<entity>/_components/<name>.tsx`.
2. If a second route needs the same component, extract the reusable shape into a base primitive in `src/components/domain/` and have both routes import from there.
3. Accept the Server Action as an `action` prop typed to the matching function signature from `layer-actions`.
4. For the Triagem form, implement controlled `resultado` state and derive `motivoOptions` from it.

---

## References

- [RHPages](rh-pages.md)
- [SharedUIComponents](shared-ui-components.md)
- [../../layer-actions/references/triagens-actions.md](../../layer-actions/references/triagens-actions.md)

Related skills:
- [shadcn](../../shadcn/SKILL.md)
- [react-best-practices](../../react-best-practices/SKILL.md)

Real implementations:
- `src/app/(rh)/` `_components/` folders (no files exist at scaffold time)
- `src/components/domain/` (no files exist at scaffold time)
