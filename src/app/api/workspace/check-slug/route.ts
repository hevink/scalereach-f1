import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";

const SLUG_REGEX = /^[a-z][a-z0-9-]*$/;
const MIN_SLUG_LENGTH = 3;
const MAX_SLUG_LENGTH = 30;
const RESERVED_SLUGS = [
  "api",
  "auth",
  "login",
  "signup",
  "logout",
  "onboarding",
  "settings",
  "admin",
  "dashboard",
  "home",
  "workspace",
  "workspaces",
  "app",
  "help",
  "support",
  "docs",
  "blog",
  "pricing",
  "about",
  "contact",
  "terms",
  "privacy",
  "legal",
];

function validateSlug(slug: string): { valid: boolean; error?: string } {
  if (!slug) {
    return { valid: false, error: "Slug is required" };
  }

  if (slug.length < MIN_SLUG_LENGTH) {
    return {
      valid: false,
      error: `Slug must be at least ${MIN_SLUG_LENGTH} characters`,
    };
  }

  if (slug.length > MAX_SLUG_LENGTH) {
    return {
      valid: false,
      error: `Slug must be at most ${MAX_SLUG_LENGTH} characters`,
    };
  }

  if (!SLUG_REGEX.test(slug)) {
    return {
      valid: false,
      error:
        "Slug must start with a letter and contain only lowercase letters, numbers, and hyphens",
    };
  }

  if (slug.endsWith("-")) {
    return { valid: false, error: "Slug cannot end with a hyphen" };
  }

  if (slug.includes("--")) {
    return { valid: false, error: "Slug cannot contain consecutive hyphens" };
  }

  if (RESERVED_SLUGS.includes(slug)) {
    return { valid: false, error: "This slug is reserved" };
  }

  return { valid: true };
}

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug")?.toLowerCase().trim();

    if (!slug) {
      return NextResponse.json({ error: "Slug is required" }, { status: 400 });
    }

    const validation = validateSlug(slug);
    if (!validation.valid) {
      return NextResponse.json(
        { available: false, error: validation.error },
        { status: 200 }
      );
    }

    const existing = await db
      .select({ id: workspace.id })
      .from(workspace)
      .where(eq(workspace.slug, slug))
      .limit(1);

    return NextResponse.json({
      available: existing.length === 0,
      error: existing.length > 0 ? "This slug is already taken" : undefined,
    });
  } catch (error) {
    safeError("Error checking slug:", error);
    return NextResponse.json(
      { error: "Failed to check slug availability" },
      { status: 500 }
    );
  }
}
