import { afterEach, describe, expect, it, vi } from "vitest";

const {
  gerarRespostaEstruturadaMock,
  findBySlotMock,
  findActiveByProviderMock,
  findByIdWithJoinsMock,
} = vi.hoisted(() => ({
  gerarRespostaEstruturadaMock: vi.fn(),
  findBySlotMock: vi.fn(),
  findActiveByProviderMock: vi.fn(),
  findByIdWithJoinsMock: vi.fn(),
}));

vi.mock("~/lib/agents/agent-client", () => ({
  gerarRespostaEstruturada: gerarRespostaEstruturadaMock,
}));
vi.mock("~/server/db/repositories/agente-config", () => ({
  agenteConfigRepository: { findBySlot: findBySlotMock },
}));
vi.mock("~/server/db/repositories/llm-credencial", () => ({
  llmCredencialRepository: { findActiveByProvider: findActiveByProviderMock },
}));
vi.mock("~/server/db/repositories/triagem", () => ({
  triagemRepository: { findByIdWithJoins: findByIdWithJoinsMock },
}));
vi.mock("~/lib/agents/crypto", () => ({
  decryptCredential: (v: string) => `decrypted:${v}`,
}));

import { executarAvaliadorTriagem } from "./avaliador-triagem";

const config = {
  ativo: true,
  provider: "google_ai_studio",
  model: "gemini-3.5-flash",
  systemPrompt: "sys",
  userPrompt: "user",
};
const credencial = { apiKeyCifrada: "cifrada" };
const triagem = {
  id: "t1",
  candidato: { id: "c1", nome: "Maria" },
  vaga: { id: "v1", cargo: { titulo: "Dev" } },
};

describe("executarAvaliadorTriagem", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws when triagem is not found", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    findByIdWithJoinsMock.mockResolvedValueOnce(null);

    await expect(executarAvaliadorTriagem("missing")).rejects.toThrow(/não encontrada/);
  });

  it("returns the evaluation with triagemId attached and score as a string", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    findByIdWithJoinsMock.mockResolvedValueOnce(triagem);
    gerarRespostaEstruturadaMock.mockResolvedValueOnce({
      vagaFoiInferida: false,
      pontosFortes: "x",
      requisitosFaltantes: "y",
      eliminatoriosFalhos: "z",
      alertas: "w",
      scoreIa: 77,
      parecerIa: "bom",
    });

    const result = await executarAvaliadorTriagem("t1");

    expect(result.triagemId).toBe("t1");
    expect(result.scoreIa).toBe("77");
  });
});
