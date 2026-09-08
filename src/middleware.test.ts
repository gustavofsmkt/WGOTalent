import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { findByIdMock } = vi.hoisted(() => ({ findByIdMock: vi.fn() }));

vi.mock("~/env", () => ({
  env: { SESSION_SECRET: "test-session-secret-with-at-least-32-chars" },
}));
vi.mock("~/server/db/repositories/usuario", () => ({
  usuarioRepository: { findById: findByIdMock },
}));

import { middleware } from "./middleware";
import {
  AUTHENTICATED_USER_HEADER,
  parseAuthenticatedUser,
} from "./lib/auth/middleware-user";
import {
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "./lib/auth/session-token";

async function authenticatedRequest(pathname: string) {
  const now = Math.floor(Date.now() / 1000);
  const token = await signSessionToken({
    userId: "11111111-1111-4111-8111-111111111111",
    username: "admin",
    passwordVersion: 1,
    issuedAt: now,
    expiresAt: now + 60,
  });
  return new NextRequest(`http://localhost${pathname}`, {
    headers: { cookie: `${SESSION_COOKIE_NAME}=${token}` },
  });
}

describe("authentication middleware", () => {
  beforeEach(() => {
    findByIdMock.mockReset();
  });

  it("redirects an unauthenticated page request to login and preserves the path", async () => {
    const response = await middleware(
      new NextRequest("http://localhost/candidatos?pagina=2"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fcandidatos%3Fpagina%3D2",
    );
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it("allows an authenticated page request", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "11111111-1111-4111-8111-111111111111",
      username: "admin",
      passwordVersion: 1,
      createdAt: "2026-09-08T12:00:00.000Z",
      updatedAt: "2026-09-08T12:00:00.000Z",
    });
    const response = await middleware(await authenticatedRequest("/dashboard"));

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
    expect(
      parseAuthenticatedUser(
        response.headers.get(
          `x-middleware-request-${AUTHENTICATED_USER_HEADER}`,
        ),
      ),
    ).toMatchObject({ username: "admin" });
  });

  it("rejects a signed session after its password version changes", async () => {
    findByIdMock.mockResolvedValueOnce({
      id: "11111111-1111-4111-8111-111111111111",
      username: "admin",
      passwordVersion: 2,
      createdAt: "2026-09-08T12:00:00.000Z",
      updatedAt: "2026-09-08T12:00:00.000Z",
    });

    const response = await middleware(await authenticatedRequest("/dashboard"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost/login?next=%2Fdashboard",
    );
  });

  it("keeps login and health public", async () => {
    const [loginResponse, healthResponse] = await Promise.all([
      middleware(new NextRequest("http://localhost/login")),
      middleware(new NextRequest("http://localhost/api/health")),
    ]);

    expect(loginResponse.status).toBe(200);
    expect(healthResponse.status).toBe(200);
  });

  it("strips a client-supplied internal user header from public requests", async () => {
    const response = await middleware(
      new NextRequest("http://localhost/login", {
        headers: { [AUTHENTICATED_USER_HEADER]: "spoofed" },
      }),
    );

    expect(
      response.headers.get(`x-middleware-request-${AUTHENTICATED_USER_HEADER}`),
    ).toBeNull();
  });
});
