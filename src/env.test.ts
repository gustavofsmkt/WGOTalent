import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("T3 Typed Environment Validation", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("exports validated env properties when environment variables are set correctly", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:password@localhost:5432/wgotalent";
    process.env.STORAGE_ROOT = "./storage";
    process.env.AGENT_CREDENTIALS_ENCRYPTION_KEY = "a".repeat(32);
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";

    const { env } = await import("~/env");

    expect(env.DATABASE_URL).toBe("postgresql://postgres:password@localhost:5432/wgotalent");
    expect(env.STORAGE_ROOT).toBe("./storage");
    expect(env.NODE_ENV).toBe("test");
  });

  it("fails validation when DATABASE_URL is missing", async () => {
    process.env.STORAGE_ROOT = "./storage";
    delete process.env.DATABASE_URL;

    await expect(import("~/env")).rejects.toThrow();
  });

  it("fails validation when STORAGE_ROOT is missing", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:password@localhost:5432/wgotalent";
    delete process.env.STORAGE_ROOT;

    await expect(import("~/env")).rejects.toThrow();
  });

  it("fails validation when empty string is passed for required variable", async () => {
    process.env.DATABASE_URL = "postgresql://postgres:password@localhost:5432/wgotalent";
    process.env.STORAGE_ROOT = "";

    await expect(import("~/env")).rejects.toThrow();
  });

  it("does not expose secret values in error messages on validation failure", async () => {
    const sensitiveSecret = "my_top_secret_token_12345";
    process.env.DATABASE_URL = "invalid-url-not-a-postgres-url";
    process.env.STORAGE_ROOT = "./storage";

    try {
      await import("~/env");
      expect.fail("Expected environment validation to throw an error");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      expect(errorMessage).not.toContain(sensitiveSecret);
    }
  });
});
