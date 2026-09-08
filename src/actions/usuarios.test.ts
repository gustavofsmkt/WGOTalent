import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  requireAuthenticatedUserMock,
  createSessionMock,
  generateNumericPasswordMock,
  hashPasswordMock,
  verifyPasswordMock,
  findByIdMock,
  createMock,
  updatePasswordMock,
  revalidatePathMock,
} = vi.hoisted(() => ({
  requireAuthenticatedUserMock: vi.fn(),
  createSessionMock: vi.fn(),
  generateNumericPasswordMock: vi.fn(),
  hashPasswordMock: vi.fn(),
  verifyPasswordMock: vi.fn(),
  findByIdMock: vi.fn(),
  createMock: vi.fn(),
  updatePasswordMock: vi.fn(),
  revalidatePathMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("~/lib/auth/dal", () => ({
  requireAuthenticatedUser: requireAuthenticatedUserMock,
}));
vi.mock("~/lib/auth/session", () => ({ createSession: createSessionMock }));
vi.mock("~/lib/auth/password", () => ({
  generateNumericPassword: generateNumericPasswordMock,
  hashPassword: hashPasswordMock,
  verifyPassword: verifyPasswordMock,
}));
vi.mock("~/server/db/repositories/usuario", () => ({
  usuarioRepository: {
    findById: findByIdMock,
    create: createMock,
    updatePassword: updatePasswordMock,
  },
}));

import {
  changeOwnPassword,
  createUsuario,
  resetUsuarioPassword,
} from "./usuarios";

const currentUser = {
  id: "11111111-1111-4111-8111-111111111111",
  username: "admin",
};
const storedUser = {
  ...currentUser,
  passwordHash: "old-hash",
  passwordVersion: 1,
  createdAt: "2026-09-08T12:00:00.000Z",
  updatedAt: "2026-09-08T12:00:00.000Z",
  deletedAt: null,
};

describe("usuarios server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAuthenticatedUserMock.mockResolvedValue(currentUser);
    generateNumericPasswordMock.mockReturnValue("12345678");
    hashPasswordMock.mockResolvedValue("new-hash");
    createSessionMock.mockResolvedValue(undefined);
  });

  it("creates a user with the generated password hash and returns the password once", async () => {
    createMock.mockResolvedValue({
      ...storedUser,
      id: "user-2",
      username: "maria",
    });

    const result = await createUsuario({ username: "Maria" });

    expect(createMock).toHaveBeenCalledWith({
      username: "maria",
      passwordHash: "new-hash",
    });
    expect(result).toMatchObject({
      success: true,
      data: { generatedPassword: "12345678", user: { username: "maria" } },
    });
  });

  it("resets a password and refreshes the session when resetting itself", async () => {
    updatePasswordMock.mockResolvedValue({ ...storedUser, passwordVersion: 2 });

    const result = await resetUsuarioPassword(currentUser.id);

    expect(updatePasswordMock).toHaveBeenCalledWith(currentUser.id, "new-hash");
    expect(createSessionMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: currentUser.id, passwordVersion: 2 }),
    );
    expect(result).toMatchObject({
      success: true,
      data: { generatedPassword: "12345678" },
    });
  });

  it("rejects a password change when the current password is wrong", async () => {
    findByIdMock.mockResolvedValue(storedUser);
    verifyPasswordMock.mockResolvedValue(false);

    const result = await changeOwnPassword({
      currentPassword: "wrong-password",
      newPassword: "new-password",
      confirmPassword: "new-password",
    });

    expect(result).toEqual({
      success: false,
      message: "A senha atual está incorreta.",
    });
    expect(updatePasswordMock).not.toHaveBeenCalled();
  });
});
