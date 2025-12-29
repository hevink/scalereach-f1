import { NextResponse } from "next/server";

const MAX_BODY_SIZE = 1_000_000;

export function validateBodySize(request: Request): NextResponse | null {
  const contentLength = request.headers.get("content-length");

  if (contentLength) {
    const size = Number.parseInt(contentLength, 10);
    if (size > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }
  }

  return null;
}

export function validateParsedBodySize(body: unknown): NextResponse | null {
  try {
    const bodyString = JSON.stringify(body);
    if (bodyString.length > MAX_BODY_SIZE) {
      return NextResponse.json(
        { error: "Request body too large" },
        { status: 413 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  return null;
}
