import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { executarCicloDeCapturaMock } = vi.hoisted(() => ({
  executarCicloDeCapturaMock: vi.fn(),
}));

vi.mock("~/env", () => ({
  env: { EMAIL_CAPTURA_INTERVALO_MS: 60000 },
}));
vi.mock("./captura-curriculos", () => ({
  executarCicloDeCaptura: executarCicloDeCapturaMock,
}));

import { iniciarLoopDeCaptura } from "./captura-curriculos-loop";

describe("iniciarLoopDeCaptura", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reseta o estado guardado em globalThis entre testes — sem isso o
    // guard contra HMR (por design) impediria o 2º/3º teste de reiniciar o
    // loop.
    (globalThis as Record<string, unknown>).__wgotalentEmailCapturaLoop =
      undefined;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fires the cycle repeatedly on the configured interval", async () => {
    executarCicloDeCapturaMock.mockResolvedValue(undefined);

    iniciarLoopDeCaptura();

    await vi.advanceTimersByTimeAsync(60000);
    expect(executarCicloDeCapturaMock).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(60000);
    expect(executarCicloDeCapturaMock).toHaveBeenCalledTimes(2);
  });

  it("skips a tick if the previous cycle has not resolved yet (overlap guard)", async () => {
    let resolveFirstCycle: (() => void) | undefined;
    executarCicloDeCapturaMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstCycle = resolve;
        }),
    );
    executarCicloDeCapturaMock.mockResolvedValueOnce(undefined);

    iniciarLoopDeCaptura();

    await vi.advanceTimersByTimeAsync(60000);
    expect(executarCicloDeCapturaMock).toHaveBeenCalledTimes(1);

    // O ciclo anterior ainda não resolveu — este tick deve ser pulado.
    await vi.advanceTimersByTimeAsync(60000);
    expect(executarCicloDeCapturaMock).toHaveBeenCalledTimes(1);

    resolveFirstCycle?.();
    await vi.advanceTimersByTimeAsync(0);

    await vi.advanceTimersByTimeAsync(60000);
    expect(executarCicloDeCapturaMock).toHaveBeenCalledTimes(2);
  });

  it("calling it twice (simulating HMR) does not create two intervals", async () => {
    executarCicloDeCapturaMock.mockResolvedValue(undefined);

    iniciarLoopDeCaptura();
    iniciarLoopDeCaptura();

    await vi.advanceTimersByTimeAsync(60000);
    expect(executarCicloDeCapturaMock).toHaveBeenCalledTimes(1);
  });

  it("does not crash the process when a cycle rejects", async () => {
    executarCicloDeCapturaMock.mockRejectedValueOnce(
      new Error("falha no ciclo"),
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    iniciarLoopDeCaptura();
    await vi.advanceTimersByTimeAsync(60000);

    expect(consoleErrorSpy).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
