import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  const filename = request.nextUrl.searchParams.get("filename") || "clip.mp4";

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  // Only allow downloading from your own CDN/storage domains
  try {
    const parsed = new URL(url);
    const allowedHosts = [
      "cdn.scalereach.ai",
      ".r2.dev",
      ".r2.cloudflarestorage.com",
      ".cloudfront.net",
      "s3.amazonaws.com",
      ".s3.amazonaws.com",
    ];
    const isAllowed = allowedHosts.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith(host)
    );
    if (!isAllowed) {
      return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: response.status }
      );
    }

    const headers = new Headers();
    headers.set("Content-Disposition", `attachment; filename="${filename}"`);
    headers.set("Content-Type", response.headers.get("Content-Type") || "video/mp4");
    const contentLength = response.headers.get("Content-Length");
    if (contentLength) {
      headers.set("Content-Length", contentLength);
    }

    return new NextResponse(response.body, { status: 200, headers });
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
