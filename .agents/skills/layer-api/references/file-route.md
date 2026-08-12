# FileRoute

The `GET /api/files/[...path]` Route Handler. Streams resume files from the
local storage root to the HTTP response. The only path through which files leave
storage — they are never served via `public/` or Next.js static routing.

## Responsibilities

Resolves the file path from URL segments, validates that the resolved path stays
within `STORAGE_ROOT` (path traversal guard), reads the file, and streams it with
the correct `Content-Type` header. In the MVP, access is open — the handler is
structured so an auth check can be inserted before streaming without a rewrite.

Not responsible for: writing files to storage (→ layer-actions CandidatosActions,
→ N8nWebhookRoute), access control policy (post-MVP concern), or serving anything
other than files referenced by `Candidato.curriculo_arquivo_key`.

### Where does it live?

`src/app/api/files/[...path]/route.ts`

### Building blocks

No sub-artifacts.

### Structural convention

```ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STORAGE_ROOT = path.join(process.cwd(), '.storage');

export async function GET(
  _req: Request,
  { params }: { params: { path: string[] } },
) {
  // MVP: auth gate goes here when auth is added
  const filePath = path.resolve(STORAGE_ROOT, ...params.path);

  if (!filePath.startsWith(STORAGE_ROOT + path.sep)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const stream = fs.createReadStream(filePath);
  return new Response(stream as unknown as ReadableStream, {
    headers: { 'Content-Type': 'application/pdf' },
  });
}
```

### Hard rules

- Always use `path.resolve()` and verify the result starts with `STORAGE_ROOT + path.sep` — never skip the traversal guard.
- Never redirect to a public filesystem path — always stream through this handler.
- `STORAGE_ROOT` must match the value used in `LocalStorageProvider`.

---

## Workflow

Touch when adding auth, supporting additional file MIME types, or changing the storage root.

1. Add the auth check before the `createReadStream` call.
2. Detect MIME type from the file extension if supporting non-PDF files.
3. Keep `STORAGE_ROOT` in sync with `src/lib/storage/local-storage-provider.ts`.

---

## References

- [N8nWebhookRoute](n8n-webhook-route.md)
- [../../layer-storage/references/local-storage-provider.md](../../layer-storage/references/local-storage-provider.md)

Real implementations:
- `src/app/api/files/[...path]/route.ts`
