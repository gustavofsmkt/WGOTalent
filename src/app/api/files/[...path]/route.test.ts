import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import type { NextRequest } from "next/server";
import { storage } from "~/lib/storage";

// Mock the storage singleton
vi.mock("~/lib/storage", () => ({
  storage: {
    read: vi.fn(),
  },
}));

describe("GET /api/files/[...path]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockRequest = {} as NextRequest;

  it("should return 400 if path is invalid or empty", async () => {
    const response = await GET(mockRequest, {
      params: Promise.resolve({ path: [] }),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid path");
  });

  it("should return 404 if file is not found", async () => {
    vi.mocked(storage.read).mockRejectedValueOnce(
      new Error("File not found for key"),
    );

    const response = await GET(mockRequest, {
      params: Promise.resolve({ path: ["missing.pdf"] }),
    });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("File not found");
  });

  it("should return 400 on path traversal attempts", async () => {
    vi.mocked(storage.read).mockRejectedValueOnce(
      new Error("Path traversal detected"),
    );

    const response = await GET(mockRequest, {
      params: Promise.resolve({ path: ["..", "secret.txt"] }),
    });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Bad request");
  });

  it("should return 200 and file content with correct headers for PDF", async () => {
    const mockBuffer = Buffer.from("fake-pdf-content");
    vi.mocked(storage.read).mockResolvedValueOnce(mockBuffer);

    const response = await GET(mockRequest, {
      params: Promise.resolve({ path: ["resume.pdf"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe(
      'inline; filename="resume.pdf"',
    );
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=3600");

    const arrayBuffer = await response.arrayBuffer();
    expect(Buffer.from(arrayBuffer).toString()).toBe("fake-pdf-content");
    expect(storage.read).toHaveBeenCalledWith("resume.pdf");
  });

  it("should handle nested paths correctly", async () => {
    const mockBuffer = Buffer.from("content");
    vi.mocked(storage.read).mockResolvedValueOnce(mockBuffer);

    const response = await GET(mockRequest, {
      params: Promise.resolve({ path: ["users", "123", "doc.txt"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.headers.get("Content-Disposition")).toBe(
      'inline; filename="doc.txt"',
    );
    expect(storage.read).toHaveBeenCalledWith("users/123/doc.txt");
  });

  it("should fallback to application/octet-stream for unknown extensions", async () => {
    const mockBuffer = Buffer.from("content");
    vi.mocked(storage.read).mockResolvedValueOnce(mockBuffer);

    const response = await GET(mockRequest, {
      params: Promise.resolve({ path: ["file.unknown"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe(
      "application/octet-stream",
    );
  });

  it("should support custom filename and attachment disposition with download=true", async () => {
    const mockBuffer = Buffer.from("fake-pdf-content");
    vi.mocked(storage.read).mockResolvedValueOnce(mockBuffer);

    const requestWithDownload = {
      url: "http://localhost:3000/api/files/resumes/uuid-123.pdf?filename=Marina%20Costa.pdf&download=true",
    } as NextRequest;

    const response = await GET(requestWithDownload, {
      params: Promise.resolve({ path: ["resumes", "uuid-123.pdf"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(
      `attachment; filename="Marina Costa.pdf"; filename*=UTF-8''Marina%20Costa.pdf`,
    );
  });

  it("should append file extension if custom filename does not have it", async () => {
    const mockBuffer = Buffer.from("fake-pdf-content");
    vi.mocked(storage.read).mockResolvedValueOnce(mockBuffer);

    const requestWithoutExt = {
      url: "http://localhost:3000/api/files/resumes/uuid-123.pdf?filename=Lucas%20Albuquerque",
    } as NextRequest;

    const response = await GET(requestWithoutExt, {
      params: Promise.resolve({ path: ["resumes", "uuid-123.pdf"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(
      `inline; filename="Lucas Albuquerque.pdf"; filename*=UTF-8''Lucas%20Albuquerque.pdf`,
    );
  });

  it("should handle UTF-8 accented characters in custom filename", async () => {
    const mockBuffer = Buffer.from("fake-pdf-content");
    vi.mocked(storage.read).mockResolvedValueOnce(mockBuffer);

    const requestWithAccents = {
      url: "http://localhost:3000/api/files/resumes/uuid-123.pdf?filename=João%20Araújo.pdf&download=true",
    } as NextRequest;

    const response = await GET(requestWithAccents, {
      params: Promise.resolve({ path: ["resumes", "uuid-123.pdf"] }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Disposition")).toBe(
      `attachment; filename="Jo_o Ara_jo.pdf"; filename*=UTF-8''Jo%C3%A3o%20Ara%C3%BAjo.pdf`,
    );
  });
});
