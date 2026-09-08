import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  createUsuarioSchema,
  loginSchema,
} from "./usuario";

describe("usuario validation", () => {
  it("normalizes usernames", () => {
    expect(createUsuarioSchema.parse({ username: "  Admin.Teste  " })).toEqual({
      username: "admin.teste",
    });
  });

  it("rejects unsafe username characters", () => {
    expect(
      createUsuarioSchema.safeParse({ username: "admin teste" }).success,
    ).toBe(false);
  });

  it("requires a login password", () => {
    expect(
      loginSchema.safeParse({ username: "admin", password: "" }).success,
    ).toBe(false);
  });

  it("requires matching, changed passwords", () => {
    expect(
      changePasswordSchema.safeParse({
        currentPassword: "password-one",
        newPassword: "password-two",
        confirmPassword: "different",
      }).success,
    ).toBe(false);

    expect(
      changePasswordSchema.safeParse({
        currentPassword: "password-one",
        newPassword: "password-one",
        confirmPassword: "password-one",
      }).success,
    ).toBe(false);
  });
});
