import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    AGENT_CREDENTIALS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    NODE_ENV: "test",
  },
}));
vi.mock("~/lib/email/imap-client", () => ({
  buscarMensagensNovas: vi.fn(),
}));
vi.mock("~/server/candidatos/processar-curriculo-recebido", () => ({
  processarCurriculoRecebido: vi.fn(),
}));

import { executarCicloDeCaptura } from "./captura-curriculos";
import { emailCredencialRepository } from "~/server/db/repositories/email-credencial";
import { buscarMensagensNovas } from "~/lib/email/imap-client";
import { processarCurriculoRecebido } from "~/server/candidatos/processar-curriculo-recebido";
import { encryptCredential } from "~/lib/agents/crypto";
import type { EmailCredencial } from "~/server/db/schema";

function fakeCredencial(overrides: Partial<EmailCredencial> = {}): EmailCredencial {
  return {
    id: "cred-1",
    host: "imap.gmail.com",
    porta: 993,
    usuario: "rh@empresa.com",
    senhaCifrada: encryptCredential("senha-de-app"),
    pasta: "INBOX",
    ultimoUidProcessado: 10,
    ativo: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    ...overrides,
  };
}

describe("executarCicloDeCaptura", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is a no-op when there is no active credential", async () => {
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(null);

    await executarCicloDeCaptura();

    expect(buscarMensagensNovas).not.toHaveBeenCalled();
  });

  it("logs and returns without throwing when the IMAP connection fails", async () => {
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(fakeCredencial());
    vi.mocked(buscarMensagensNovas).mockRejectedValueOnce(new Error("connection refused"));
    const atualizarWatermarkSpy = vi.spyOn(emailCredencialRepository, "atualizarWatermark");
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(executarCicloDeCaptura()).resolves.toBeUndefined();

    expect(atualizarWatermarkSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedMessage = consoleErrorSpy.mock.calls[0]?.[0] as string;
    expect(loggedMessage).not.toContain("senha-de-app");
    consoleErrorSpy.mockRestore();
  });

  it("advances the watermark to the highest UID seen only after the cycle completes", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 10 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(credencial);
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce([
      { uid: 11, anexos: [{ filename: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("a") }] },
      { uid: 15, anexos: [] },
    ]);
    vi.mocked(processarCurriculoRecebido).mockResolvedValueOnce({
      status: "sucesso",
      candidatoId: "cand-1",
      mensagem: "Candidato criado com sucesso.",
    });
    const atualizarWatermarkSpy = vi
      .spyOn(emailCredencialRepository, "atualizarWatermark")
      .mockResolvedValueOnce(undefined);

    await executarCicloDeCaptura();

    expect(atualizarWatermarkSpy).toHaveBeenCalledWith("cred-1", 15);
  });

  it("does not let one failed attachment stop the others or block the watermark advance", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 0 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(credencial);
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce([
      {
        uid: 1,
        anexos: [
          { filename: "ruim.pdf", mimeType: "application/pdf", buffer: Buffer.from("a") },
          { filename: "bom.pdf", mimeType: "application/pdf", buffer: Buffer.from("b") },
        ],
      },
    ]);
    vi.mocked(processarCurriculoRecebido)
      .mockResolvedValueOnce({ status: "erro", mensagem: "falhou" })
      .mockResolvedValueOnce({ status: "sucesso", candidatoId: "cand-2", mensagem: "ok" });
    const atualizarWatermarkSpy = vi
      .spyOn(emailCredencialRepository, "atualizarWatermark")
      .mockResolvedValueOnce(undefined);

    await executarCicloDeCaptura();

    expect(processarCurriculoRecebido).toHaveBeenCalledTimes(2);
    expect(atualizarWatermarkSpy).toHaveBeenCalledWith("cred-1", 1);
  });

  it("isolates an unexpected rejection from one item and still advances the watermark (runWithLimit)", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 10 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(credencial);
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce([
      { uid: 11, anexos: [{ filename: "cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("a") }] },
    ]);
    vi.mocked(processarCurriculoRecebido).mockRejectedValueOnce(new Error("bug inesperado"));
    const atualizarWatermarkSpy = vi
      .spyOn(emailCredencialRepository, "atualizarWatermark")
      .mockResolvedValueOnce(undefined);

    await expect(executarCicloDeCaptura()).resolves.toBeUndefined();

    expect(atualizarWatermarkSpy).toHaveBeenCalledWith("cred-1", 11);
  });
});
