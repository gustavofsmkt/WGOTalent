import fs from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "./storage";

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
   * Keys may use "/" to namespace files into subdirectories (e.g. "curriculos/foo.pdf").
   */
  private getFilePath(key: string): string {
    // Reject traversal segments, backslashes (Windows separator injection) and
    // absolute-path-like keys; "/" itself is allowed as a subdirectory separator.
    if (key.includes("..") || key.includes("\\") || key.startsWith("/")) {
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
   * Ensures the parent directory of a resolved file path exists.
   */
  private async ensureDir(filePath: string): Promise<void> {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
    } catch (error) {
      throw new Error(
        `Failed to create storage directory: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async save(
    key: string,
    data: Buffer | Uint8Array | string,
    _contentType?: string,
  ): Promise<void> {
    const filePath = this.getFilePath(key);
    await this.ensureDir(filePath);

    try {
      await fs.writeFile(filePath, data);
    } catch (error) {
      throw new Error(
        `Failed to save file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async read(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);

    try {
      return await fs.readFile(filePath);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        throw new Error(`File not found for key: ${key}`);
      }
      throw new Error(
        `Failed to read file: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    const filePath = this.getFilePath(key);

    try {
      await fs.unlink(filePath);
    } catch (error) {
      // Idempotent: ignore if file doesn't exist
      if (
        error instanceof Error &&
        "code" in error &&
        error.code !== "ENOENT"
      ) {
        throw new Error(
          `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
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
