import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  cookiesMock,
  headersMock,
  redirectMock,
  findByIdMock,
  verifySessionTokenMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  headersMock: vi.fn(),
  redirectMock: vi.fn(),
  findByIdMock: vi.fn(),
  verifySessionTokenMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("react", () => ({ cache: <T>(callback: T) => callback }));
vi.mock("next/headers", () => ({
  cookies: cookiesMock,
  headers: headersMock,
}));
vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("~/server/db/repositories/usuario", () => ({
  usuarioRepository: { findById: findByIdMock },
}));
vi.mock("~/lib/auth/session-token", () => ({
  SESSION_COOKIE_NAME: "wgo_session",
  verifySessionToken: verifySessionTokenMock,
}));

import { getCurrentUser } from "./dal";
import {
  AUTHENTICATED_USER_HEADER,
  serializeAuthenticatedUser,
} from "./middleware-user";

const user = {
  id: "11111111-1111-4111-8111-111111111111",
  username: "admin",
  createdAt: "2026-09-08T12:00:00.000Z",
  updatedAt: "2026-09-08T12:00:00.000Z",
};
const session = {
  userId: user.id,
  username: user.username,
  passwordVersion: 1,
  issuedAt: 1,
  expiresAt: 2,
};

describe("authentication DAL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "signed-token" }),
    });
    verifySessionTokenMock.mockResolvedValue(session);
  });

  it("reuses the identity already checked by middleware without another query", async () => {
    headersMock.mockResolvedValue(
      new Headers({
        [AUTHENTICATED_USER_HEADER]: serializeAuthenticatedUser(user),
      }),
    );

    await expect(getCurrentUser()).resolves.toEqual(user);
    expect(verifySessionTokenMock).toHaveBeenCalledWith("signed-token");
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it("falls back to cookie and database validation without the internal header", async () => {
    headersMock.mockResolvedValue(new Headers());
    cookiesMock.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "signed-token" }),
    });
    findByIdMock.mockResolvedValue({ ...user, passwordVersion: 1 });

    await expect(getCurrentUser()).resolves.toEqual(user);
    expect(findByIdMock).toHaveBeenCalledOnce();
  });

  it("rejects a forged internal header without a valid signed cookie", async () => {
    headersMock.mockResolvedValue(
      new Headers({
        [AUTHENTICATED_USER_HEADER]: serializeAuthenticatedUser(user),
      }),
    );
    verifySessionTokenMock.mockResolvedValue(null);

    await expect(getCurrentUser()).resolves.toBeNull();
    expect(findByIdMock).not.toHaveBeenCalled();
  });
});
