import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";
import { storage } from "@/lib/storage";

// Mock the storage singleton
vi.mock("@/lib/storage", () => ({
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
    const response = await GET(mockRequest, { params: Promise.resolve({ path: [] }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Invalid path");
  });

  it("should return 404 if file is not found", async () => {
    vi.mocked(storage.read).mockRejectedValueOnce(new Error("File not found for key"));
    
    const response = await GET(mockRequest, { params: Promise.resolve({ path: ["missing.pdf"] }) });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("File not found");
  });

  it("should return 400 on path traversal attempts", async () => {
    vi.mocked(storage.read).mockRejectedValueOnce(new Error("Path traversal detected"));
    
    const response = await GET(mockRequest, { params: Promise.resolve({ path: ["..", "secret.txt"] }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("Bad request");
  });

  it("should return 200 and file content with correct headers for PDF", async () => {
    const mockBuffer = Buffer.from("fake-pdf-content");
    vi.mocked(storage.read).mockResolvedValueOnce(mockBuffer);
    
    const response = await GET(mockRequest, { params: Promise.resolve({ path: ["resume.pdf"] }) });
    
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toBe('inline; filename="resume.pdf"');
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=3600");
    
    const arrayBuffer = await response.arrayBuffer();
    expect(Buffer.from(arrayBuffer).toString()).toBe("fake-pdf-content");
    expect(storage.read).toHaveBeenCalledWith("resume.pdf");
  });

  it("should handle nested paths correctly", async () => {
    const mockBuffer = Buffer.from("content");
    vi.mocked(storage.read).mockResolvedValueOnce(mockBuffer);
    
    const response = await GET(mockRequest, { params: Promise.resolve({ path: ["users", "123", "doc.txt"] }) });
    
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/plain");
    expect(response.headers.get("Content-Disposition")).toBe('inline; filename="doc.txt"');
    expect(storage.read).toHaveBeenCalledWith("users/123/doc.txt");
  });

  it("should fallback to application/octet-stream for unknown extensions", async () => {
    const mockBuffer = Buffer.from("content");
    vi.mocked(storage.read).mockResolvedValueOnce(mockBuffer);
    
    const response = await GET(mockRequest, { params: Promise.resolve({ path: ["file.unknown"] }) });
    
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
  });
});
