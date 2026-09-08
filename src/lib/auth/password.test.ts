import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  generateNumericPassword,
  hashPassword,
  verifyPassword,
} from "./password";

describe("password helpers", () => {
  it("hashes and verifies a password without storing the original value", async () => {
    const hash = await hashPassword("admin");

    expect(hash).toMatch(/^scrypt\$[^$]+\$[^$]+$/u);
    expect(hash).not.toContain("admin");
    await expect(verifyPassword("admin", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong", hash)).resolves.toBe(false);
  });

  it("rejects malformed hashes", async () => {
    await expect(verifyPassword("admin", "invalid")).resolves.toBe(false);
  });

  it("generates an eight-digit password", () => {
    for (let index = 0; index < 25; index += 1) {
      expect(generateNumericPassword()).toMatch(/^\d{8}$/u);
    }
  });
});
