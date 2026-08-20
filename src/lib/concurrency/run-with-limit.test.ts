import { describe, expect, it } from "vitest";
import { runWithLimit } from "./run-with-limit";

describe("runWithLimit", () => {
  it("respects the concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;

    await runWithLimit([1, 2, 3, 4, 5, 6], 2, async (item) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return item * 2;
    });

    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("preserves result order matching input order", async () => {
    const delays = [30, 10, 20];
    const results = await runWithLimit(delays, 3, async (delay) => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return delay;
    });

    expect(results.map((r) => (r.ok ? r.value : null))).toEqual([30, 10, 20]);
  });

  it("isolates a failing item without derailing the others", async () => {
    const results = await runWithLimit([1, 2, 3], 2, async (item) => {
      if (item === 2) throw new Error("boom");
      return item;
    });

    expect(results[0]).toEqual({ ok: true, value: 1 });
    expect(results[1]!.ok).toBe(false);
    expect((results[1] as { ok: false; error: unknown }).error).toBeInstanceOf(Error);
    expect(results[2]).toEqual({ ok: true, value: 3 });
  });

  it("handles an empty list", async () => {
    const results = await runWithLimit([], 3, async (x) => x);
    expect(results).toEqual([]);
  });
});
