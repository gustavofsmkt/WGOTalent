# LocalStorageProvider

The local disk implementation of `StorageProvider` for the MVP. Stores resume
files on the server filesystem in a `.storage/` directory at the repo root,
outside `public/`, keyed by a path derived from the candidate ID.

## Responsibilities

Implements `save()` (writes a `Buffer` to disk at the given key path),
`getUrl()` (returns the `/api/files/<key>` path consumed by the file-serving
route handler), and `delete()` (removes the file). Exports a singleton `storage`
instance consumed by `layer-actions` and `layer-api`.

Not responsible for: the `StorageProvider` interface definition (→ StorageProvider),
HTTP serving (→ layer-api FileRoute), or access control on file retrieval
(→ layer-api FileRoute, post-MVP concern).

### Where does it live?

`src/lib/storage/local-storage-provider.ts`

### Building blocks

No sub-artifacts. Related: [StorageProvider](storage-provider.md).

### Structural convention

```ts
import fs from 'fs/promises';
import path from 'path';
import { env } from '~/env';
import type { StorageProvider, StorageKey } from './storage';

const STORAGE_ROOT = env.STORAGE_ROOT;

class LocalStorageProvider implements StorageProvider {
  async save(key: StorageKey, buffer: Buffer, _mimeType: string): Promise<void> {
    const dest = path.join(STORAGE_ROOT, key);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, buffer);
  }

  getUrl(key: StorageKey): string {
    return `/api/files/${key}`;
  }

  async delete(key: StorageKey): Promise<void> {
    await fs.unlink(path.join(STORAGE_ROOT, key)).catch(() => {});
  }
}

export const storage = new LocalStorageProvider();
```

### Hard rules

- `STORAGE_ROOT` comes from `env.STORAGE_ROOT` (declared in `src/env.js`) — never hardcode a path.
- `getUrl()` returns an `/api/files/` path, never a direct filesystem path.
- Export a singleton `storage` — never instantiate `LocalStorageProvider` elsewhere.
- `.storage/` must be added to `.gitignore`.

---

## Workflow

Touch only when changing the storage root, adding a new method, or replacing this implementation with an S3 provider.

1. Implement the new method or adjust the path convention.
2. If switching to S3: create `src/lib/storage/s3-storage-provider.ts`, implement the interface, then change the export in this file (or a new `index.ts`) to the S3 class.

---

## References

- [StorageProvider](storage-provider.md)
- [../../layer-api/references/file-route.md](../../layer-api/references/file-route.md)

Real implementations:
- `src/lib/storage/local-storage-provider.ts`
