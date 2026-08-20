import { afterEach, describe, expect, it, vi } from "vitest";

const {
  gerarRespostaEstruturadaMock,
  findBySlotMock,
  findActiveByProviderMock,
  storageReadMock,
} = vi.hoisted(() => ({
  gerarRespostaEstruturadaMock: vi.fn(),
  findBySlotMock: vi.fn(),
  findActiveByProviderMock: vi.fn(),
  storageReadMock: vi.fn(),
}));

vi.mock("~/lib/agents/gemini-client", () => ({
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
vi.mock("~/lib/storage", () => ({
  storage: { read: storageReadMock },
}));
vi.mock("mammoth", () => ({
  default: { extractRawText: vi.fn().mockResolvedValue({ value: "texto do docx" }) },
}));

import { executarExtracaoCurriculo } from "./extracao-curriculo";

const config = {
  ativo: true,
  model: "gemini-3.5-flash",
  systemPrompt: "system",
  userPrompt: "user",
};
const credencial = { apiKeyCifrada: "cifrada" };

describe("executarExtracaoCurriculo", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("throws when the agent slot is not active", async () => {
    findBySlotMock.mockResolvedValueOnce({ ...config, ativo: false });
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    storageReadMock.mockResolvedValueOnce(Buffer.from("pdf"));

    await expect(executarExtracaoCurriculo("resumes/a.pdf")).rejects.toThrow(/ativo/);
  });

  it("throws when no active credential exists for the provider", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(null);
    storageReadMock.mockResolvedValueOnce(Buffer.from("pdf"));

    await expect(executarExtracaoCurriculo("resumes/a.pdf")).rejects.toThrow(/credencial/);
  });

  it("sends multimodal inlineData for a PDF file", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    storageReadMock.mockResolvedValueOnce(Buffer.from("pdf-bytes"));
    gerarRespostaEstruturadaMock.mockResolvedValueOnce({ nome: "Maria" });

    await executarExtracaoCurriculo("resumes/a.pdf");

    const call = gerarRespostaEstruturadaMock.mock.calls[0]![0];
    expect(call.arquivo.mimeType).toBe("application/pdf");
    expect(call.apiKey).toBe("decrypted:cifrada");
  });

  it("converts DOCX to text via mammoth instead of sending inlineData", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    storageReadMock.mockResolvedValueOnce(Buffer.from("docx-bytes"));
    gerarRespostaEstruturadaMock.mockResolvedValueOnce({ nome: "Maria" });

    await executarExtracaoCurriculo("resumes/a.docx");

    const call = gerarRespostaEstruturadaMock.mock.calls[0]![0];
    expect(call.arquivo).toBeUndefined();
    expect(call.userPrompt).toContain("texto do docx");
  });

  it("throws for an unsupported extension", async () => {
    findBySlotMock.mockResolvedValueOnce(config);
    findActiveByProviderMock.mockResolvedValueOnce(credencial);
    storageReadMock.mockResolvedValueOnce(Buffer.from("bytes"));

    await expect(executarExtracaoCurriculo("resumes/a.rtf")).rejects.toThrow(/não suportada/);
  });
});
