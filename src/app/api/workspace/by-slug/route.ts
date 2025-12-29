import { NextResponse } from "next/server";
import { safeError } from "@/lib/logger";
import { getWorkspaceAccess } from "@/lib/workspace-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (!slug) {
      return NextResponse.json(
        { error: "Workspace slug is required" },
        { status: 400 }
      );
    }

    const access = await getWorkspaceAccess(slug);

    if (!access) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      workspace: {
        id: access.workspace.id,
        name: access.workspace.name,
        slug: access.workspace.slug,
        description: access.workspace.description,
        logo: access.workspace.logo,
        role: access.role,
      },
    });
  } catch (error) {
    safeError("Error fetching workspace:", error);
    return NextResponse.json(
      { error: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
}
