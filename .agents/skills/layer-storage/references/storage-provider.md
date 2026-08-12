# StorageProvider

The TypeScript interface that defines the file storage contract. Every storage
backend (local disk, S3, Azure Blob) implements this interface, making callers
in `layer-actions` and `layer-api` backend-agnostic.

## Responsibilities

Declares `save(key, buffer, mimeType)`, `getUrl(key)`, and `delete(key)` method
signatures. Also declares `StorageKey` as the string alias used by
`Candidato.curriculo_arquivo_key`.

Not responsible for: the concrete I/O (→ LocalStorageProvider), HTTP file serving
(→ layer-api FileRoute), or the Candidato mutation that calls `save`
(→ layer-actions CandidatosActions).

### Where does it live?

`src/lib/storage/storage.ts`

### Building blocks

No sub-artifacts. Related: [LocalStorageProvider](local-storage-provider.md).

### Structural convention

```ts
export type StorageKey = string;

export interface StorageProvider {
  save(key: StorageKey, buffer: Buffer, mimeType: string): Promise<void>;
  getUrl(key: StorageKey): string;
  delete(key: StorageKey): Promise<void>;
}
```

### Hard rules

- `getUrl()` returns a relative internal path (e.g. `/api/files/<key>`) — never a public filesystem path or a pre-signed URL that bypasses the auth-gated route handler.
- `save()` must be idempotent on the same key (overwrite if exists).

---

## Workflow

Add a method to the interface only when both `layer-actions` and `layer-api` need a new storage operation.

1. Add the method signature to `StorageProvider` in `src/lib/storage/storage.ts`.
2. Implement it in `LocalStorageProvider`.
3. TypeScript will surface all callers that need updating.

---

## References

- [LocalStorageProvider](local-storage-provider.md)
- [../../layer-actions/references/candidatos-actions.md](../../layer-actions/references/candidatos-actions.md)
- [../../layer-api/references/file-route.md](../../layer-api/references/file-route.md)

Real implementations:
- `src/lib/storage/storage.ts`
