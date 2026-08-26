import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Credential encryption (AES-256-GCM)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    process.env.DATABASE_URL =
      "postgresql://postgres:password@localhost:5432/wgotalent";
    process.env.STORAGE_ROOT = "./storage";
    process.env.AGENT_CREDENTIALS_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString(
      "base64",
    );
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("decrypts back to the original plaintext", async () => {
    const { encryptCredential, decryptCredential } = await import("./crypto");

    const plainText = "sk-test-super-secret-api-key";
    const cipherText = encryptCredential(plainText);

    expect(cipherText).not.toContain(plainText);
    expect(decryptCredential(cipherText)).toBe(plainText);
  });

  it("throws when the ciphertext has been tampered with", async () => {
    const { encryptCredential, decryptCredential } = await import("./crypto");

    const cipherText = encryptCredential("sk-test-super-secret-api-key");
    const tampered = Buffer.from(cipherText, "base64");
    tampered[tampered.length - 1] = tampered[tampered.length - 1]! ^ 0xff;

    expect(() => decryptCredential(tampered.toString("base64"))).toThrow();
  });
});
