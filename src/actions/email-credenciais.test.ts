import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("~/env", () => ({
  env: {
    DATABASE_URL: "postgres://postgres:postgres@localhost:5432/wgotalent",
    STORAGE_ROOT: "./storage",
    AGENT_CREDENTIALS_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    NODE_ENV: "test",
  },
}));

import {
  createEmailCredencial,
  deactivateEmailCredencial,
  deleteEmailCredencial,
} from "./email-credenciais";
import { emailCredencialRepository } from "~/server/db/repositories/email-credencial";
import { revalidatePath } from "next/cache";

describe("email-credenciais server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createEmailCredencial", () => {
    it("encrypts the password before persisting and never returns it", async () => {
      vi.spyOn(emailCredencialRepository, "create").mockResolvedValueOnce({
        id: "cred-1",
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senhaCifrada: "cifrada",
        pasta: "INBOX",
        ativo: true,
        ultimoUidProcessado: null,
        capturarDesde: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      const result = await createEmailCredencial({
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senha: "senha-real-secreta",
        pasta: "INBOX",
      });

      expect(result.success).toBe(true);
      const createCall = vi.mocked(emailCredencialRepository.create).mock.calls[0]![0];
      expect(createCall.senhaCifrada).not.toContain("senha-real-secreta");
      if (result.success) {
        expect(result.data).not.toHaveProperty("senha");
        expect(result.data).not.toHaveProperty("senhaCifrada");
      }
      expect(revalidatePath).toHaveBeenCalledWith("/admin");
    });

    it("does not set an initial watermark by default — first capture skips the mailbox's history", async () => {
      vi.spyOn(emailCredencialRepository, "create").mockResolvedValueOnce({
        id: "cred-1",
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senhaCifrada: "cifrada",
        pasta: "INBOX",
        ativo: true,
        ultimoUidProcessado: null,
        capturarDesde: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      await createEmailCredencial({
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senha: "senha-real-secreta",
        pasta: "INBOX",
      });

      const createCall = vi.mocked(emailCredencialRepository.create).mock.calls[0]![0];
      expect(createCall).not.toHaveProperty("ultimoUidProcessado");
      expect(createCall).not.toHaveProperty("capturarDesde");
    });

    it("seeds the watermark at 0 and stores capturarDesde when it's set — first capture processes the mailbox from that date on", async () => {
      vi.spyOn(emailCredencialRepository, "create").mockResolvedValueOnce({
        id: "cred-1",
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senhaCifrada: "cifrada",
        pasta: "INBOX",
        ativo: true,
        ultimoUidProcessado: 0,
        capturarDesde: "2026-05-24",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      await createEmailCredencial({
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senha: "senha-real-secreta",
        pasta: "INBOX",
        capturarDesde: "2026-05-24",
      });

      const createCall = vi.mocked(emailCredencialRepository.create).mock.calls[0]![0];
      expect(createCall.ultimoUidProcessado).toBe(0);
      expect(createCall.capturarDesde).toBe("2026-05-24");
    });

    it("rejects an empty password", async () => {
      const result = await createEmailCredencial({
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senha: "",
        pasta: "INBOX",
      });

      expect(result.success).toBe(false);
      expect(emailCredencialRepository.create).not.toHaveBeenCalled();
    });

    it("rejects an invalid port", async () => {
      const result = await createEmailCredencial({
        host: "imap.gmail.com",
        porta: 99999,
        usuario: "rh@empresa.com",
        senha: "algo",
        pasta: "INBOX",
      });

      expect(result.success).toBe(false);
      expect(emailCredencialRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("deactivateEmailCredencial", () => {
    it("deactivates the credential", async () => {
      vi.spyOn(emailCredencialRepository, "deactivate").mockResolvedValueOnce(null);

      const result = await deactivateEmailCredencial("cred-1");

      expect(result.success).toBe(true);
      expect(emailCredencialRepository.deactivate).toHaveBeenCalledWith("cred-1");
    });
  });

  describe("deleteEmailCredencial", () => {
    it("soft-deletes an inactive credential", async () => {
      vi.spyOn(emailCredencialRepository, "findById").mockResolvedValueOnce({
        id: "cred-1",
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senhaCifrada: "cifrada",
        pasta: "INBOX",
        ativo: false,
        ultimoUidProcessado: null,
        capturarDesde: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
      vi.spyOn(emailCredencialRepository, "softDelete").mockResolvedValueOnce(null);

      const result = await deleteEmailCredencial("cred-1");

      expect(result.success).toBe(true);
      expect(emailCredencialRepository.softDelete).toHaveBeenCalledWith("cred-1");
    });

    it("refuses to delete an active credential", async () => {
      vi.spyOn(emailCredencialRepository, "findById").mockResolvedValueOnce({
        id: "cred-1",
        host: "imap.gmail.com",
        porta: 993,
        usuario: "rh@empresa.com",
        senhaCifrada: "cifrada",
        pasta: "INBOX",
        ativo: true,
        ultimoUidProcessado: null,
        capturarDesde: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
      const softDeleteSpy = vi.spyOn(emailCredencialRepository, "softDelete");

      const result = await deleteEmailCredencial("cred-1");

      expect(result.success).toBe(false);
      expect(softDeleteSpy).not.toHaveBeenCalled();
    });

    it("returns an error when the credential does not exist", async () => {
      vi.spyOn(emailCredencialRepository, "findById").mockResolvedValueOnce(null);

      const result = await deleteEmailCredencial("missing");

      expect(result.success).toBe(false);
    });
  });
});
