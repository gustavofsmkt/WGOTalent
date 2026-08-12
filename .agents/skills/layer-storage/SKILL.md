---
name: layer-storage
description: >-
  Owns the StorageProvider abstraction and its LocalStorageProvider implementation
  for resume file storage. Load when touching src/lib/storage/storage.ts or
  src/lib/storage/local-storage-provider.ts, or when any code calls
  StorageProvider.save(), .getUrl(), or .delete(). Trigger terms: StorageProvider,
  curriculo_arquivo_key, file upload, resume file, local storage, S3, Blob,
  STORAGE_ROOT, storage singleton, save(), getUrl(), delete(). Do NOT load for
  the file-serving Route Handler (→ layer-api FileRoute) or the Candidato Server
  Action that calls storage (→ layer-actions CandidatosActions).
---

# Storage Layer

Owns the `StorageProvider` port and its local disk implementation for the MVP.
Provides a swappable abstraction so the file backend can be replaced with S3 or
Azure Blob without touching callers in `layer-actions` or `layer-api`. Has no
dependencies on any other layer — it is a self-contained I/O abstraction.

## Responsibilities

Defines the `StorageProvider` interface (`save`, `getUrl`, `delete`), implements
it for local disk in `LocalStorageProvider`, and exports a singleton instance
consumed by `layer-actions` and `layer-api`. Resume files are stored outside
`public/` and are never served by Next.js static routing.

Not responsible for: validating file content (→ layer-validation), serving files
over HTTP (→ layer-api FileRoute), or deciding which Candidato a file belongs to
(→ layer-actions CandidatosActions).

### Where does it live?

- `src/lib/storage/storage.ts` — `StorageProvider` interface and `StorageKey` type
- `src/lib/storage/local-storage-provider.ts` — `LocalStorageProvider` implementation + singleton export

### Building blocks

- **StorageProvider** — TypeScript interface defining the file storage contract. See [Reference](references/storage-provider.md).
- **LocalStorageProvider** — Local disk implementation of `StorageProvider` for the MVP. See [Reference](references/local-storage-provider.md).

### Hard rules

- Files must never be stored under `public/` — the storage root must be outside the Next.js public directory.
- `curriculo_arquivo_key` stored in `Candidato` is a storage key/path, never a public URL.
- The singleton exported from `src/lib/storage/local-storage-provider.ts` is the only `StorageProvider` instance used at runtime — never instantiate elsewhere.
- Never call `fs` directly outside `src/lib/storage/` — all file I/O goes through `StorageProvider`.

---

## Workflow

Work here when changing the storage backend or adding a new storage operation.

1. Update the `StorageProvider` interface in `src/lib/storage/storage.ts`. See [StorageProvider](references/storage-provider.md).
2. Implement the new method in `LocalStorageProvider`. See [LocalStorageProvider](references/local-storage-provider.md).
3. If adding an S3 provider: create `src/lib/storage/s3-storage-provider.ts` implementing the same interface, then update the singleton export to switch implementations.
4. Smoke test: upload a resume via the Candidato form, then fetch it via `/api/files/<key>`.

---

## References

- [StorageProvider](references/storage-provider.md)
- [LocalStorageProvider](references/local-storage-provider.md)
