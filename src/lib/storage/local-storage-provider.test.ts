import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalStorageProvider } from "./local-storage-provider";

describe("LocalStorageProvider", () => {
  let tempDir: string;
  let provider: LocalStorageProvider;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "wgo-storage-test-"));
    provider = new LocalStorageProvider(tempDir);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should construct with valid root dir", () => {
    expect(() => new LocalStorageProvider(tempDir)).not.toThrow();
  });

  it("should fail if constructed with empty root dir", () => {
    expect(() => new LocalStorageProvider("")).toThrow("Local storage root directory must be specified");
  });

  it("should successfully save and read a file", async () => {
    const key = "test-key.txt";
    const content = "Hello, World!";

    await provider.save(key, content);

    const readBack = await provider.read(key);
    expect(readBack.toString()).toBe(content);
  });

  it("should overwrite existing file", async () => {
    const key = "test-key.txt";

    await provider.save(key, "Old content");
    await provider.save(key, "New content");

    const readBack = await provider.read(key);
    expect(readBack.toString()).toBe("New content");
  });

  it("should throw an error when reading a non-existent file", async () => {
    const key = "non-existent.txt";
    await expect(provider.read(key)).rejects.toThrow("File not found for key: non-existent.txt");
  });

  it("should successfully delete a file", async () => {
    const key = "test-key.txt";
    const content = "Hello, World!";

    await provider.save(key, content);
    await provider.delete(key);

    await expect(provider.read(key)).rejects.toThrow("File not found for key: test-key.txt");
  });

  it("should be idempotent when deleting non-existent file", async () => {
    const key = "non-existent.txt";
    await expect(provider.delete(key)).resolves.not.toThrow();
  });

  it("should prevent path traversal attacks in save", async () => {
    await expect(provider.save("../traversal.txt", "data")).rejects.toThrow("Invalid storage key");
    await expect(provider.save("folder/file.txt", "data")).rejects.toThrow("Invalid storage key");
    await expect(provider.save("folder\\file.txt", "data")).rejects.toThrow("Invalid storage key");
  });

  it("should return a valid access reference", async () => {
    const key = "test-key.txt";
    const ref = await provider.getAccessReference(key);
    expect(ref).toBe(`/api/files/${key}`);
  });
});
