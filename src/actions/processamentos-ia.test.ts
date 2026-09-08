import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  claimRetryMock,
  claimLatestFailuresMock,
  findByIdMock,
  finalizarMock,
  reprocessarProcessamentoIaMock,
  reprocessarIngestaoCurriculoMock,
  revalidatePathMock,
  afterMock,
} = vi.hoisted(() => ({
  claimRetryMock: vi.fn(),
  claimLatestFailuresMock: vi.fn(),
  findByIdMock: vi.fn(),
  finalizarMock: vi.fn(),
  reprocessarProcessamentoIaMock: vi.fn(),
  reprocessarIngestaoCurriculoMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  afterMock: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("next/server", () => ({ after: afterMock }));
vi.mock("~/server/db/repositories/processamento-ia", () => ({
  processamentoIaRepository: {
    claimRetry: claimRetryMock,
    claimLatestFailures: claimLatestFailuresMock,
    findById: findByIdMock,
    finalizar: finalizarMock,
  },
}));
vi.mock("~/server/agents/orquestracao", () => ({
  reprocessarProcessamentoIa: reprocessarProcessamentoIaMock,
}));
vi.mock("~/server/candidatos/processar-curriculo-recebido", () => ({
  reprocessarIngestaoCurriculo: reprocessarIngestaoCurriculoMock,
}));

import {
  retryProcessamentoIa,
  retryUltimasFalhasIa,
} from "./processamentos-ia";

const id = "11111111-1111-4111-8111-111111111111";
const claimed = {
  id,
  status: "processando",
  fluxo: "candidato_vagas",
  etapa: "classificador",
  itensPendentes: ["v1"],
};

async function runScheduledRetry(index = 0) {
  const callback = afterMock.mock.calls[index]?.[0] as
    (() => Promise<void>) | undefined;
  expect(callback).toBeTypeOf("function");
  await callback?.();
}

describe("retryProcessamentoIa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    finalizarMock.mockResolvedValue(null);
  });

  it("claims a failure and schedules it without waiting for the AI", async () => {
    claimRetryMock.mockResolvedValueOnce(claimed);

    const result = await retryProcessamentoIa(id);

    expect(result.success).toBe(true);
    expect(result.message).toContain("segundo plano");
    expect(afterMock).toHaveBeenCalledOnce();
    expect(reprocessarProcessamentoIaMock).not.toHaveBeenCalled();

    await runScheduledRetry();

    expect(reprocessarProcessamentoIaMock).toHaveBeenCalledWith(claimed);
    expect(revalidatePathMock).toHaveBeenCalledWith("/processamentos-ia");
  });

  it("dispatches ingestion retries to reprocessarIngestaoCurriculo", async () => {
    const ingestao = {
      ...claimed,
      fluxo: "ingestao_curriculo",
      etapa: "extracao",
      arquivoKey: "resumes/abc.pdf",
    };
    claimRetryMock.mockResolvedValueOnce(ingestao);

    const result = await retryProcessamentoIa(id);

    expect(result.success).toBe(true);
    await runScheduledRetry();

    expect(reprocessarIngestaoCurriculoMock).toHaveBeenCalledWith(ingestao);
    expect(reprocessarProcessamentoIaMock).not.toHaveBeenCalled();
  });

  it("prevents a simultaneous retry when the processing is already running", async () => {
    claimRetryMock.mockResolvedValueOnce(null);
    findByIdMock.mockResolvedValueOnce({ ...claimed, status: "processando" });

    const result = await retryProcessamentoIa(id);

    expect(result.success).toBe(false);
    expect(result.message).toContain("já está em andamento");
    expect(reprocessarProcessamentoIaMock).not.toHaveBeenCalled();
  });

  it("releases the claimed processing as a failure after an unexpected interruption", async () => {
    claimRetryMock.mockResolvedValueOnce(claimed);
    reprocessarProcessamentoIaMock.mockRejectedValueOnce(
      new Error("provider payload that must not reach the UI"),
    );

    const result = await retryProcessamentoIa(id);

    expect(result.success).toBe(true);
    await runScheduledRetry();

    expect(finalizarMock).toHaveBeenCalledWith(id, {
      status: "falha",
      mensagem: "A nova tentativa foi interrompida inesperadamente.",
    });
  });

  it("releases the claim when the background task cannot be scheduled", async () => {
    claimRetryMock.mockResolvedValueOnce(claimed);
    afterMock.mockImplementationOnce(() => {
      throw new Error("background runtime unavailable");
    });

    const result = await retryProcessamentoIa(id);

    expect(finalizarMock).toHaveBeenCalledWith(id, {
      status: "falha",
      mensagem: "Não foi possível iniciar a nova tentativa.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid id before accessing the repository", async () => {
    const result = await retryProcessamentoIa("invalid");

    expect(result.success).toBe(false);
    expect(claimRetryMock).not.toHaveBeenCalled();
  });
});

describe("retryUltimasFalhasIa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    finalizarMock.mockResolvedValue(null);
  });

  it("claims at most 15 recent failures and schedules them in the background", async () => {
    const failures = Array.from({ length: 15 }, (_, index) => ({
      ...claimed,
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
    }));
    claimLatestFailuresMock.mockResolvedValueOnce(failures);

    const result = await retryUltimasFalhasIa("candidato_vagas");

    expect(claimLatestFailuresMock).toHaveBeenCalledWith("candidato_vagas", 15);
    expect(result).toMatchObject({
      success: true,
      data: { agendados: 15 },
    });
    expect(reprocessarProcessamentoIaMock).not.toHaveBeenCalled();

    await runScheduledRetry();

    expect(reprocessarProcessamentoIaMock).toHaveBeenCalledTimes(15);
  });

  it("does not schedule work when no retryable failure is available", async () => {
    claimLatestFailuresMock.mockResolvedValueOnce([]);

    const result = await retryUltimasFalhasIa("ingestao_curriculo");

    expect(result.success).toBe(false);
    expect(result.data?.agendados).toBe(0);
    expect(afterMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid flow before accessing the repository", async () => {
    const result = await retryUltimasFalhasIa("outro_fluxo");

    expect(result.success).toBe(false);
    expect(claimLatestFailuresMock).not.toHaveBeenCalled();
  });
});
