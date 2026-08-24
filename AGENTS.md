# WGOTalent — HR Platform (Triagem de Candidatos)

Next.js 16+ App Router HR platform for managing departments, job positions,
job openings, candidates, and AI-assisted resume screening.

## Source precedence

When rules conflict, apply in this order:
1. Instructions in this file (`AGENTS.md` / `CLAUDE.md`) and `docs/`.
2. Official documentation for the exact version installed in the project
   (supersedes examples in older skills).
3. General model knowledge.

## Architecture overview

Six ordered layers. Each layer skill governs what lives where and which rules apply.

| Layer | Skill | Folder(s) | Depends on |
|---|---|---|---|
| 1 | `layer-db` | `src/server/db/` | — |
| 2 | `layer-validation` | `src/lib/validation/` | `layer-db` |
| 3 | `layer-storage` | `src/lib/storage/` | — |
| 4 | `layer-actions` | `src/actions/` | `layer-db`, `layer-validation`, `layer-storage` |
| 5 | `layer-api` | `src/app/api/` | `layer-db`, `layer-validation`, `layer-storage` |
| 6 | `layer-ui` | `src/app/(rh)/`, `src/components/` | `layer-db` (reads), `layer-actions` (form bindings) |

## Schema

The canonical data model is `docs/db_triagem_proposta.ts`. Always check it before
writing a query, form, or validation schema.

## Invariants that apply everywhere

- **Soft delete** — every table has `deleted_at`. No hard deletes. Every `select`
  must go through `notDeleted()` from `src/server/db/query-helpers.ts`.
  See the `layer-db` skill for the canonical rules and the Repository pattern.
- **Cascade is application-level** — `deletarCandidato` must soft-delete all
  sub-entities in a single `db.transaction()`.
- **Single mutation boundary** — internal mutations go through Server Actions
  (`src/actions/`); external mutations go through Route Handlers (`src/app/api/`).
  Never bypass either.
- **Storage abstraction** — all file I/O goes through `StorageProvider`; never
  call `fs` directly outside `src/lib/storage/`.

## Environment variables

Validated via `src/env.js` (`@t3-oss/env-nextjs`). Key server-side vars:
- `DATABASE_URL` — PostgreSQL connection string
- `STORAGE_ROOT` — absolute path to the file storage directory

Import in server code as `import { env } from '~/env'` — never use `process.env.*` directly.

## Stack restrictions

- **Directory convention**: `src/` layout. `src/server/db/schema.ts`,
  `src/server/db/index.ts`, and `src/env.js` are structural — do not move or
  rename them.
- **Prohibited in MVP**: tRPC, Auth.js/NextAuth, Prisma.
- **AI Engine**: native agent engine orchestrated inside the platform (see
  `docs/decisions/0007-encerramento-integracao-n8n.md`), replacing external n8n
  workflows.
- **Dependencies**: install no library without explicit approval.

## Development practices

- One task/focus per conversation. Provide or fetch only the minimum required context.
- When refactoring or replacing logic, delete the obsolete code — no dead code left behind.
- Maintain test coverage where applicable. Never commit secrets or credentials.
- **Git**: never run `git push`. Commits must follow Conventional Commits format.

## Skills

All skills live under `.agents/skills/` (canonical). `.claude/skills/` and
`.github/skills/` are symlinks to the same directory.

### Layer skills (project-specific)
- `layer-db` — `.agents/skills/layer-db/SKILL.md`
- `layer-validation` — `.agents/skills/layer-validation/SKILL.md`
- `layer-storage` — `.agents/skills/layer-storage/SKILL.md`
- `layer-actions` — `.agents/skills/layer-actions/SKILL.md`
- `layer-api` — `.agents/skills/layer-api/SKILL.md`
- `layer-ui` — `.agents/skills/layer-ui/SKILL.md`

### General skills
- `drizzle-orm-patterns` — `.agents/skills/drizzle-orm-patterns/SKILL.md`
- `tanstack-form` — `.agents/skills/tanstack-form/SKILL.md`
- `zod-validation-utilities` — `.agents/skills/zod-validation-utilities/SKILL.md`
- `nextjs-app-router-patterns` — `.agents/skills/nextjs-app-router-patterns/SKILL.md`
- `react-best-practices` — `.agents/skills/react-best-practices/SKILL.md`
- `shadcn` — `.agents/skills/shadcn/SKILL.md`
- `tailwind-css-patterns` — `.agents/skills/tailwind-css-patterns/SKILL.md`
- `tailwind-design-system` — `.agents/skills/tailwind-design-system/SKILL.md`
- `composition-patterns` — `.agents/skills/composition-patterns/SKILL.md`
- `building-components` — `.agents/skills/building-components/SKILL.md`
- `impeccable` — `.agents/skills/impeccable/SKILL.md`
- `layer-skills` — `.agents/skills/layer-skills/SKILL.MD`

### Governance skills (Copilot)
- `drizzle-migration-check` — `.agents/skills/drizzle-migration-check/SKILL.md`
- `repository-cleanliness-check` — `.agents/skills/repository-cleanliness-check/SKILL.md`
- `soft-delete-check` — `.agents/skills/soft-delete-check/SKILL.md`
- `task-closeout` — `.agents/skills/task-closeout/SKILL.md`
