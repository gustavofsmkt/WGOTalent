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
  createCredencial,
  deactivateCredencial,
  deleteCredencial,
} from "./credenciais";
import { llmCredencialRepository } from "~/server/db/repositories/llm-credencial";

describe("credenciais server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCredencial", () => {
    it("encrypts the API key before persisting and never returns it", async () => {
      vi.spyOn(llmCredencialRepository, "existsRecentDuplicate").mockResolvedValueOnce(
        false,
      );
      vi.spyOn(llmCredencialRepository, "create").mockResolvedValueOnce({
        id: "cred-1",
        provider: "google_ai_studio",
        apiKeyCifrada: "cifrada",
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });

      const result = await createCredencial({
        provider: "google_ai_studio",
        apiKey: "sk-real-secret",
      });

      expect(result.success).toBe(true);
      const createCall = vi.mocked(llmCredencialRepository.create).mock.calls[0]![0];
      expect(createCall.apiKeyCifrada).not.toContain("sk-real-secret");
      if (result.success) {
        expect(result.data).not.toHaveProperty("apiKey");
      }
    });

    it("rejects an empty API key", async () => {
      const result = await createCredencial({ provider: "google_ai_studio", apiKey: "" });
      expect(result.success).toBe(false);
      expect(llmCredencialRepository.create).not.toHaveBeenCalled();
    });

    it("blocks creation when a recent duplicate submission is detected", async () => {
      vi.spyOn(llmCredencialRepository, "existsRecentDuplicate").mockResolvedValueOnce(
        true,
      );
      vi.spyOn(llmCredencialRepository, "create");

      const result = await createCredencial({
        provider: "google_ai_studio",
        apiKey: "sk-real-secret",
      });

      expect(result.success).toBe(false);
      expect(result.message).toBe(
        "Esta credencial já foi cadastrada (envio duplicado detectado).",
      );
      expect(llmCredencialRepository.create).not.toHaveBeenCalled();
    });
  });

  describe("deactivateCredencial", () => {
    it("deactivates the credential", async () => {
      vi.spyOn(llmCredencialRepository, "deactivate").mockResolvedValueOnce(null);

      const result = await deactivateCredencial("cred-1");

      expect(result.success).toBe(true);
      expect(llmCredencialRepository.deactivate).toHaveBeenCalledWith("cred-1");
    });
  });

  describe("deleteCredencial", () => {
    it("soft-deletes an inactive credential", async () => {
      vi.spyOn(llmCredencialRepository, "findById").mockResolvedValueOnce({
        id: "cred-1",
        provider: "google_ai_studio",
        apiKeyCifrada: "cifrada",
        ativo: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
      vi.spyOn(llmCredencialRepository, "softDelete").mockResolvedValueOnce(null);

      const result = await deleteCredencial("cred-1");

      expect(result.success).toBe(true);
      expect(llmCredencialRepository.softDelete).toHaveBeenCalledWith("cred-1");
    });

    it("refuses to delete an active credential", async () => {
      vi.spyOn(llmCredencialRepository, "findById").mockResolvedValueOnce({
        id: "cred-1",
        provider: "google_ai_studio",
        apiKeyCifrada: "cifrada",
        ativo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      });
      const softDeleteSpy = vi.spyOn(llmCredencialRepository, "softDelete");

      const result = await deleteCredencial("cred-1");

      expect(result.success).toBe(false);
      expect(softDeleteSpy).not.toHaveBeenCalled();
    });

    it("returns an error when the credential does not exist", async () => {
      vi.spyOn(llmCredencialRepository, "findById").mockResolvedValueOnce(null);

      const result = await deleteCredencial("missing");

      expect(result.success).toBe(false);
    });
  });
});
