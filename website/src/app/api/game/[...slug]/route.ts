import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getLabirintoRoot, isPathInsideLabirintoRoot } from "@/lib/getLabirintoRoot";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".woff2": "font/woff2",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const root = getLabirintoRoot();
  const filePath = path.normalize(path.join(root, ...(slug ?? [])));

  if (!isPathInsideLabirintoRoot(filePath, root)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || "application/octet-stream";

  return new NextResponse(file, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "no-cache",
    },
  });
}
