import { type NextRequest, NextResponse } from "next/server";
import { storage } from "~/lib/storage";

function getMimeType(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return 'application/pdf';
    case 'txt': return 'text/plain';
    case 'doc': return 'application/msword';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    default: return 'application/octet-stream';
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
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
    
    // Stream response with secure headers
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": getMimeType(key),
        "Content-Disposition": `inline; filename="${path[path.length - 1]}"`,
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    
    if (message.includes("File not found") || message.includes("ENOENT")) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }
    
    if (message.includes("Invalid storage key") || message.includes("Path traversal")) {
      return NextResponse.json({ error: "Bad request" }, { status: 400 });
    }
    
    console.error("[File Route] Error serving file:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
