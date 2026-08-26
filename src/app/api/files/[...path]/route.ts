import { type NextRequest, NextResponse } from "next/server";
import { storage } from "~/lib/storage";

function getMimeType(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "txt":
      return "text/plain";
    case "doc":
      return "application/msword";
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

function buildContentDisposition(
  defaultFilename: string,
  customFilename: string | null,
  isDownload: boolean,
  key: string,
): string {
  const dispositionType = isDownload ? "attachment" : "inline";

  if (!customFilename) {
    return `${dispositionType}; filename="${defaultFilename}"`;
  }

  const ext = key.includes(".") ? `.${key.split(".").pop()}` : "";
  let finalFilename = customFilename.trim();
  if (ext && !finalFilename.toLowerCase().endsWith(ext.toLowerCase())) {
    finalFilename = `${finalFilename}${ext}`;
  }

  const asciiFallback =
    finalFilename
      .replace(/["\r\n\/\\]/g, "")
      .replace(/[^\x20-\x7E]/g, "_")
      .trim() || defaultFilename;

  const encodedFilename = encodeURIComponent(finalFilename);

  return `${dispositionType}; filename="${asciiFallback}"; filename*=UTF-8''${encodedFilename}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  // TODO: Implement authentication check here in the future

  try {
    const { path } = await params;

    if (!path || !Array.isArray(path) || path.length === 0) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    const key = path.join("/");

    // Read from storage provider
    const buffer = await storage.read(key);

    let customFilename: string | null = null;
    let isDownload = false;

    if (request?.url) {
      try {
        const url = new URL(request.url);
        customFilename =
          url.searchParams.get("filename") || url.searchParams.get("name");
        isDownload =
          url.searchParams.get("download") === "true" ||
          url.searchParams.has("download");
      } catch {
        // Ignore invalid URL
      }
    }

    const defaultFilename = path[path.length - 1] ?? "file";
    const contentDisposition = buildContentDisposition(
      defaultFilename,
      customFilename,
      isDownload,
      key,
    );

    // Stream response with secure headers
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": getMimeType(key),
        "Content-Disposition": contentDisposition,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes("File not found") || message.includes("ENOENT")) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (
      message.includes("Invalid storage key") ||
      message.includes("Path traversal")
    ) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }

    console.error("[File Route] Error serving file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
