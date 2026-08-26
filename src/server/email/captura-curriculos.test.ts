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

function fakeCredencial(
  overrides: Partial<EmailCredencial> = {},
): EmailCredencial {
  return {
    id: "cred-1",
    host: "imap.gmail.com",
    porta: 993,
    usuario: "rh@empresa.com",
    senhaCifrada: encryptCredential("senha-de-app"),
    pasta: "INBOX",
    ultimoUidProcessado: 10,
    capturarDesde: null,
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
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      null,
    );

    await executarCicloDeCaptura();

    expect(buscarMensagensNovas).not.toHaveBeenCalled();
  });

  it("requests a bounded batch size, so a large backlog is never fetched in one shot", async () => {
    const credencial = fakeCredencial();
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [],
      uidReferencia: 10,
    });

    await executarCicloDeCaptura();

    expect(buscarMensagensNovas).toHaveBeenCalledWith(
      expect.objectContaining({ limiteLote: expect.any(Number) }),
    );
  });

  it("passes the credential's capturarDesde through to buscarMensagensNovas", async () => {
    const credencial = fakeCredencial({ capturarDesde: "2026-05-24" });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [],
      uidReferencia: 10,
    });

    await executarCicloDeCaptura();

    expect(buscarMensagensNovas).toHaveBeenCalledWith(
      expect.objectContaining({ capturarDesde: "2026-05-24" }),
    );
  });

  it("logs and returns without throwing when the IMAP connection fails", async () => {
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      fakeCredencial(),
    );
    vi.mocked(buscarMensagensNovas).mockRejectedValueOnce(
      new Error("connection refused"),
    );
    const atualizarWatermarkSpy = vi.spyOn(
      emailCredencialRepository,
      "atualizarWatermark",
    );
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(executarCicloDeCaptura()).resolves.toBeUndefined();

    expect(atualizarWatermarkSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
    const loggedMessage = consoleErrorSpy.mock.calls[0]?.[0] as string;
    expect(loggedMessage).not.toContain("senha-de-app");
    consoleErrorSpy.mockRestore();
  });

  it("advances the watermark to the highest UID seen only after the cycle completes", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 10 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [
        {
          uid: 11,
          anexos: [
            {
              filename: "cv.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("a"),
            },
          ],
        },
        { uid: 15, anexos: [] },
      ],
      uidReferencia: 10,
    });
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
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [
        {
          uid: 1,
          anexos: [
            {
              filename: "ruim.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("a"),
            },
            {
              filename: "bom.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("b"),
            },
          ],
        },
      ],
      uidReferencia: 0,
    });
    vi.mocked(processarCurriculoRecebido)
      .mockResolvedValueOnce({ status: "erro", mensagem: "falhou" })
      .mockResolvedValueOnce({
        status: "sucesso",
        candidatoId: "cand-2",
        mensagem: "ok",
      });
    const atualizarWatermarkSpy = vi
      .spyOn(emailCredencialRepository, "atualizarWatermark")
      .mockResolvedValueOnce(undefined);

    await executarCicloDeCaptura();

    expect(processarCurriculoRecebido).toHaveBeenCalledTimes(2);
    expect(atualizarWatermarkSpy).toHaveBeenCalledWith("cred-1", 1);
  });

  it("isolates an unexpected rejection from one item and still advances the watermark (runWithLimit)", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 10 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [
        {
          uid: 11,
          anexos: [
            {
              filename: "cv.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("a"),
            },
          ],
        },
      ],
      uidReferencia: 10,
    });
    vi.mocked(processarCurriculoRecebido).mockRejectedValueOnce(
      new Error("bug inesperado"),
    );
    const atualizarWatermarkSpy = vi
      .spyOn(emailCredencialRepository, "atualizarWatermark")
      .mockResolvedValueOnce(undefined);

    await expect(executarCicloDeCaptura()).resolves.toBeUndefined();

    expect(atualizarWatermarkSpy).toHaveBeenCalledWith("cred-1", 11);
  });

  it("skips the mailbox's history on first capture: advances straight to uidReferencia even with zero new messages", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: null });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [],
      uidReferencia: 19116,
    });
    const atualizarWatermarkSpy = vi
      .spyOn(emailCredencialRepository, "atualizarWatermark")
      .mockResolvedValueOnce(undefined);

    await executarCicloDeCaptura();

    expect(processarCurriculoRecebido).not.toHaveBeenCalled();
    expect(atualizarWatermarkSpy).toHaveBeenCalledWith("cred-1", 19116);
  });

  it("does not write to the database when there is nothing new and the reference doesn't move the watermark forward", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 50 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [],
      uidReferencia: 50,
    });
    const atualizarWatermarkSpy = vi.spyOn(
      emailCredencialRepository,
      "atualizarWatermark",
    );

    await executarCicloDeCaptura();

    expect(atualizarWatermarkSpy).not.toHaveBeenCalled();
  });

  it("does not advance the watermark past a message that failed with a quota error — retried next cycle instead of lost", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 10 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [
        {
          uid: 11,
          anexos: [
            {
              filename: "cv.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("a"),
            },
          ],
        },
      ],
      uidReferencia: 10,
    });
    vi.mocked(processarCurriculoRecebido).mockResolvedValueOnce({
      status: "erro",
      mensagem: "Limite de requisições do provedor de IA atingido.",
      errorType: "quota",
    });
    const atualizarWatermarkSpy = vi.spyOn(
      emailCredencialRepository,
      "atualizarWatermark",
    );

    await executarCicloDeCaptura();

    expect(atualizarWatermarkSpy).not.toHaveBeenCalled();
  });

  it("stops the watermark right before the first quota-blocked message, even when later messages in the same batch succeeded", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 10 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [
        {
          uid: 11,
          anexos: [
            {
              filename: "a.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("a"),
            },
          ],
        },
        {
          uid: 12,
          anexos: [
            {
              filename: "b.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("b"),
            },
          ],
        },
        {
          uid: 13,
          anexos: [
            {
              filename: "c.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("c"),
            },
          ],
        },
      ],
      uidReferencia: 13,
    });
    vi.mocked(processarCurriculoRecebido).mockImplementation(async (input) => {
      if (input.filename === "b.pdf") {
        return {
          status: "erro",
          mensagem: "cota excedida",
          errorType: "quota",
        };
      }
      return {
        status: "sucesso",
        candidatoId: `cand-${input.filename}`,
        mensagem: "ok",
      };
    });
    const atualizarWatermarkSpy = vi
      .spyOn(emailCredencialRepository, "atualizarWatermark")
      .mockResolvedValueOnce(undefined);

    await executarCicloDeCaptura();

    // uid 11 (antes do bloqueio) resolve; uid 13 (depois) fica pendente
    // também, mesmo tendo tido sucesso — não dá pra pular à frente do 12.
    expect(atualizarWatermarkSpy).toHaveBeenCalledWith("cred-1", 11);
  });

  it("does not use uidReferencia to skip ahead when the batch was blocked by a quota error", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 10 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [
        {
          uid: 11,
          anexos: [
            {
              filename: "cv.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("a"),
            },
          ],
        },
      ],
      // uidReferencia bem à frente de 11 — não pode ser usado, pois a
      // mensagem 11 não foi resolvida.
      uidReferencia: 50,
    });
    vi.mocked(processarCurriculoRecebido).mockResolvedValueOnce({
      status: "erro",
      mensagem: "cota excedida",
      errorType: "quota",
    });
    const atualizarWatermarkSpy = vi.spyOn(
      emailCredencialRepository,
      "atualizarWatermark",
    );

    await executarCicloDeCaptura();

    expect(atualizarWatermarkSpy).not.toHaveBeenCalled();
  });

  it("when the batch was capped (uidReferencia null), only advances to the highest UID actually processed — never beyond, even though more remain", async () => {
    const credencial = fakeCredencial({ ultimoUidProcessado: 0 });
    vi.spyOn(emailCredencialRepository, "findActiva").mockResolvedValueOnce(
      credencial,
    );
    vi.mocked(buscarMensagensNovas).mockResolvedValueOnce({
      mensagens: [
        { uid: 1, anexos: [] },
        { uid: 2, anexos: [] },
      ],
      uidReferencia: null,
    });
    const atualizarWatermarkSpy = vi
      .spyOn(emailCredencialRepository, "atualizarWatermark")
      .mockResolvedValueOnce(undefined);

    await executarCicloDeCaptura();

    expect(atualizarWatermarkSpy).toHaveBeenCalledWith("cred-1", 2);
  });
});
