export type LimitedResult<R> =
  | { ok: true; value: R }
  | { ok: false; error: unknown };

/**
 * Processa `items` respeitando no máximo `limit` execuções simultâneas de
 * `worker`. A ordem dos resultados retornados corresponde à ordem de `items`.
 * Um item que falha (worker rejeita) não interrompe os demais — o erro fica
 * isolado no próprio resultado daquele item.
 */
export async function runWithLimit<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
): Promise<LimitedResult<R>[]> {
  const results: LimitedResult<R>[] = new Array(items.length);
  let nextIndex = 0;

  async function runWorker(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      try {
        const value = await worker(items[currentIndex] as T);
        results[currentIndex] = { ok: true, value };
      } catch (error) {
        results[currentIndex] = { ok: false, error };
      }
    }
  }

  const workerCount = Math.min(limit, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => runWorker()));

  return results;
}
