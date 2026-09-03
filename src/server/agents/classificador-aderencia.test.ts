import { afterEach, describe, expect, it, vi } from "vitest";

const {
  gerarRespostaEstruturadaMock,
  findBySlotMock,
  findActiveByProviderMock,
} = vi.hoisted(() => ({
  gerarRespostaEstruturadaMock: vi.fn(),
  findBySlotMock: vi.fn(),
  findActiveByProviderMock: vi.fn(),
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
vi.mock("~/lib/agents/crypto", () => ({
  decryptCredential: (v: string) => `decrypted:${v}`,
}));

import {
  executarClassificadorAderencia,
  type ItemAderencia,
} from "./classificador-aderencia";

const config = {
  ativo: true,
  provider: "google_ai_studio",
  model: "gemini-3.5-flash-lite",
  systemPrompt: "sys {{tipo_principal}}",
  userPrompt: "cmp {{tipo_comparacao}}",
};
const credencial = { apiKeyCifrada: "cifrada" };

function itens(n: number): ItemAderencia[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `v${i}`,
    resumo: `resumo ${i}`,
  }));
}

/** O agent-client devolve o objeto já validado; o classificador desembrulha `.itens`. */
function respostaComItens(lista: { id: string; score: number }[]) {
  return { itens: lista };
}

describe("executarClassificadorAderencia", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns scores for a batch within the chunk size", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    gerarRespostaEstruturadaMock.mockResolvedValueOnce(
      respostaComItens([{ id: "v0", score: 80 }]),
    );

    const result = await executarClassificadorAderencia(
      { id: "c1", resumo: "resumo candidato" },
      itens(1),
      "candidato",
      "vaga",
    );

    expect(result).toEqual({ ok: true, scores: [{ id: "v0", score: 80 }] });
    expect(gerarRespostaEstruturadaMock).toHaveBeenCalledTimes(1);
  });

  it("chunks batches larger than 25 into multiple calls", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    gerarRespostaEstruturadaMock
      .mockResolvedValueOnce(
        respostaComItens(itens(25).map((i) => ({ id: i.id, score: 10 }))),
      )
      .mockResolvedValueOnce(respostaComItens([{ id: "v25", score: 20 }]));

    const result = await executarClassificadorAderencia(
      { id: "c1", resumo: "resumo" },
      itens(26),
      "candidato",
      "vaga",
    );

    expect(gerarRespostaEstruturadaMock).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    expect(result.ok && result.scores).toHaveLength(26);
  });

  it("discards ids invented by the model that are not in the sent batch", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    gerarRespostaEstruturadaMock.mockResolvedValueOnce(
      respostaComItens([
        { id: "v0", score: 80 },
        { id: "id-inventado", score: 99 },
      ]),
    );

    const result = await executarClassificadorAderencia(
      { id: "c1", resumo: "resumo" },
      itens(1),
      "candidato",
      "vaga",
    );

    expect(result).toEqual({ ok: true, scores: [{ id: "v0", score: 80 }] });
  });

  it("returns ok:false when every chunk fails at the provider", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    gerarRespostaEstruturadaMock.mockRejectedValue(new Error("HTTP 400"));

    const result = await executarClassificadorAderencia(
      { id: "c1", resumo: "resumo" },
      itens(26),
      "candidato",
      "vaga",
    );

    expect(result).toEqual({ ok: false, motivo: "falha_provedor" });
  });

  it("returns partial scores when only some chunks fail", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    gerarRespostaEstruturadaMock
      .mockResolvedValueOnce(
        respostaComItens(itens(25).map((i) => ({ id: i.id, score: 50 }))),
      )
      .mockRejectedValueOnce(new Error("HTTP 500"));

    const result = await executarClassificadorAderencia(
      { id: "c1", resumo: "resumo" },
      itens(26),
      "candidato",
      "vaga",
    );

    expect(result.ok).toBe(true);
    expect(result.ok && result.scores).toHaveLength(25);
  });
});
