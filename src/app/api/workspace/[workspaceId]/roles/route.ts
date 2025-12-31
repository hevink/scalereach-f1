import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceRole } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";
import { getWorkspaceRoles, initializeWorkspaceRoles } from "@/lib/role-utils";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId } = await params;

    const workspaceData = await db
      .select({ slug: workspace.slug })
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    await requireWorkspaceAccess(workspaceData[0].slug);

    // Check if roles exist, if not initialize them
    const existingRoles = await db
      .select()
      .from(workspaceRole)
      .where(eq(workspaceRole.workspaceId, workspaceId))
      .limit(1);

    if (existingRoles.length === 0) {
      await initializeWorkspaceRoles(workspaceId);
    }

    const roles = await getWorkspaceRoles(workspaceId);

    return NextResponse.json({ roles });
  } catch (error) {
    safeError("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch roles" },
      { status: 500 }
    );
  }
}
