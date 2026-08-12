# SharedUIComponents

Reusable custom wrappers in `src/components/domain/shared/` — thin components built
over shadcn primitives and shared across two or more entity domain components.
`src/components/ui/` is the shadcn source directory and must never be modified.

## Responsibilities

Provides the common visual vocabulary: status badges for `Triagem.etapa` and
`Triagem.resultado`, any data-display wrapper shared across two or more entity
components, and other domain-agnostic UI pieces. All components wrap shadcn
primitives — never modify files under `src/components/ui/`.

Not responsible for: domain-specific form fields (→ DomainComponents), page
layout and data fetching (→ RHPages), or Server Actions (→ layer-actions).

### Where does it live?

`src/components/domain/shared/`

### Building blocks

No sub-artifacts. Related: [DomainComponents](domain-components.md).

### Structural convention

```tsx
// components/domain/shared/resultado-badge.tsx
import { Badge } from '@/components/ui/badge'; // shadcn source — read-only
import { cn } from '@/lib/utils';

type Resultado = 'em_andamento' | 'aprovado' | 'reprovado' | 'desistente' | 'banco_talentos';

const STYLES: Record<Resultado, string> = {
  em_andamento: 'bg-blue-100 text-blue-800',
  aprovado:     'bg-green-100 text-green-800',
  reprovado:    'bg-red-100 text-red-800',
  desistente:   'bg-gray-100 text-gray-800',
  banco_talentos: 'bg-purple-100 text-purple-800',
};

export function ResultadoBadge({ resultado }: { resultado: Resultado }) {
  return <Badge className={cn(STYLES[resultado])}>{resultado}</Badge>;
}
```

### Hard rules

- Never edit files under `src/components/ui/` — those are shadcn source files managed by the CLI. Custom code lives in `src/components/domain/shared/`.
- Enum key values for status badge maps must match `docs/db_triagem_proposta.ts` string literals exactly.
- Apply Tailwind overrides via `cn()` only — no inline styles, no arbitrary values where a design token exists.

---

## Workflow

Add a shared component when the same visual pattern appears in two or more domain components.

1. Create `src/components/domain/shared/<component>.tsx` as a wrapper over a shadcn primitive from `src/components/ui/`.
2. Apply Tailwind class overrides via `cn()`.
3. Import in domain components as needed.

---

## References

- [DomainComponents](domain-components.md)
- [RHPages](rh-pages.md)

Related skills:
- [shadcn](../../shadcn/SKILL.md)
- [tailwind-css-patterns](../../tailwind-css-patterns/SKILL.md)

Real implementations:
- `src/components/domain/shared/` (directory — no files exist at scaffold time)
