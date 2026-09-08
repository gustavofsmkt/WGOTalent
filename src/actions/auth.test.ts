import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  headersMock,
  findByUsernameMock,
  verifyPasswordMock,
  createSessionMock,
  envMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn(),
  headersMock: vi.fn(),
  findByUsernameMock: vi.fn(),
  verifyPasswordMock: vi.fn(),
  createSessionMock: vi.fn(),
  envMock: { NODE_ENV: "test" } as { NODE_ENV: string },
}));

vi.mock("server-only", () => ({}));
vi.mock("~/env", () => ({ env: envMock }));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/headers", () => ({ headers: headersMock }));
vi.mock("~/server/db/repositories/usuario", () => ({
  usuarioRepository: { findByUsername: findByUsernameMock },
}));
vi.mock("~/lib/auth/password", () => ({
  verifyPassword: verifyPasswordMock,
}));
vi.mock("~/lib/auth/session", () => ({
  createSession: createSessionMock,
  deleteSession: vi.fn(),
}));

import { login } from "./auth";

function loginData(next: string): FormData {
  const formData = new FormData();
  formData.set("username", "admin");
  formData.set("password", "admin");
  formData.set("next", next);
  return formData;
}

describe("login action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    envMock.NODE_ENV = "test";
    headersMock.mockResolvedValue({ get: vi.fn().mockReturnValue(null) });
    findByUsernameMock.mockResolvedValue({
      id: "11111111-1111-4111-8111-111111111111",
      username: "admin",
      passwordHash: "hash",
      passwordVersion: 1,
    });
    verifyPasswordMock.mockResolvedValue(true);
    createSessionMock.mockResolvedValue(undefined);
  });

  it("redirects to a local path after login", async () => {
    await login({ success: false }, loginData("/candidatos?pagina=2"));

    expect(redirectMock).toHaveBeenCalledWith("/candidatos?pagina=2");
  });

  it("rejects a backslash-based external redirect", async () => {
    await login({ success: false }, loginData("/\\evil.example"));

    expect(redirectMock).toHaveBeenCalledWith("/dashboard");
  });

  it("refuses login in production when the proxy omits the client address", async () => {
    envMock.NODE_ENV = "production";

    const result = await login({ success: false }, loginData("/dashboard"));

    expect(result).toEqual({
      success: false,
      message: "Não foi possível validar a origem da conexão. Tente novamente.",
    });
    expect(findByUsernameMock).not.toHaveBeenCalled();
    expect(verifyPasswordMock).not.toHaveBeenCalled();
  });
});
