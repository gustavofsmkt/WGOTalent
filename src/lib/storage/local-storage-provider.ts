import fs from "node:fs/promises";
import path from "node:path";
import { StorageProvider } from "./storage";

export class LocalStorageProvider implements StorageProvider {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    if (!rootDir) {
      throw new Error("Local storage root directory must be specified");
    }
    // Resolve to absolute path to prevent traversal issues at the root level
    this.rootDir = path.resolve(rootDir);
  }

  /**
   * Safely resolves a key to a full path, preventing path traversal attacks.
   */
  private getFilePath(key: string): string {
    // Basic validation to prevent obvious traversal patterns in key
    if (key.includes("..") || key.includes("/") || key.includes("\\")) {
      throw new Error("Invalid storage key");
    }

    const fullPath = path.resolve(this.rootDir, key);

    // Final safety check to ensure the resolved path is actually within the rootDir
    if (!fullPath.startsWith(this.rootDir)) {
      throw new Error("Path traversal detected");
    }

    return fullPath;
  }

  /**
   * Ensures the root directory exists.
   */
  private async ensureDir(): Promise<void> {
    try {
      await fs.mkdir(this.rootDir, { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create storage directory: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async save(
    key: string,
    data: Buffer | Uint8Array | string,
    _contentType?: string
  ): Promise<void> {
    const filePath = this.getFilePath(key);
    await this.ensureDir();

    try {
      await fs.writeFile(filePath, data);
    } catch (error) {
      throw new Error(
        `Failed to save file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async read(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);

    try {
      return await fs.readFile(filePath);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        throw new Error(`File not found for key: ${key}`);
      }
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Idempotent: ignore if file doesn't exist
      if (error instanceof Error && "code" in error && error.code !== "ENOENT") {
        throw new Error(
          `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }

  async getAccessReference(key: string): Promise<string> {
    // Ensure key is valid and prevents path traversal before returning reference
    this.getFilePath(key);
    // Return a route that can serve the file
    return `/api/files/${key}`;
  }
}
