---
name: layer-api
description: >-
  Owns all Next.js Route Handlers — the file-serving boundary and HTTP endpoints.
  Load when touching app/api/files/[...path]/route.ts or other Route Handlers.
  Trigger terms: Route Handler, file serving, curriculo download, NextResponse,
  file route, path traversal. Do NOT load for Server Actions (→ layer-actions)
  or UI pages (→ layer-ui).
---

# API Layer

Owns Next.js Route Handlers that form HTTP endpoints for the application, such as
the resume file serving route (the way files leave storage). This layer is parallel to
`layer-actions` — both consume `layer-db`, `layer-validation`, and
`layer-storage`, but neither depends on the other.

## Responsibilities

`FileRoute`: streams resume files from the local storage root through a gated HTTP
response (open in MVP, auth-gated post-MVP).

Not responsible for: internal form mutations (→ layer-actions), schema definitions
(→ layer-db), Zod schema definitions (→ layer-validation), or rendering
(→ layer-ui).

### Where does it live?

- `src/app/api/files/[...path]/route.ts` — GET endpoint for resume file streaming

### Building blocks

- **FileRoute** — Streams resume files from `StorageProvider` through a gated HTTP response. See [Reference](references/file-route.md).

### Hard rules

- `FileRoute` must validate that the resolved file path stays within `STORAGE_ROOT` to prevent path traversal — return 403 if not.
- Return `NextResponse.json` / `Response` with appropriate HTTP status codes: 400 for validation failures, 401 for auth, 403 for path violations, 500 for unhandled errors.

---

## Workflow

Work here when access control is added to the file route, or when a new external-facing endpoint is required.

1. For file route changes: update `src/lib/storage/storage.ts` first if a new operation is needed, then update the route. See [FileRoute](references/file-route.md).

---

## References

- [FileRoute](references/file-route.md)
