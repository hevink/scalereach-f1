import { eq, or } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allWorkspaces = await db
      .select({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        logo: workspace.logo,
        role: workspaceMember.role,
        ownerId: workspace.ownerId,
      })
      .from(workspace)
      .leftJoin(workspaceMember, eq(workspaceMember.workspaceId, workspace.id))
      .where(
        or(
          eq(workspace.ownerId, session.user.id),
          eq(workspaceMember.userId, session.user.id)
        )
      );

    const workspaceMap = new Map<
      string,
      {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        logo: string | null;
        role: string;
      }
    >();

    for (const ws of allWorkspaces) {
      const existing = workspaceMap.get(ws.id);

      if (ws.ownerId === session.user.id) {
        workspaceMap.set(ws.id, {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          description: ws.description,
          logo: ws.logo,
          role: "owner",
        });
      } else if (!existing && ws.role) {
        workspaceMap.set(ws.id, {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
          description: ws.description,
          logo: ws.logo,
          role: ws.role,
        });
      }
    }

    const workspaces = Array.from(workspaceMap.values());

    return NextResponse.json({ workspaces });
  } catch (error) {
    safeError("Error listing workspaces:", error);
    return NextResponse.json(
      { error: "Failed to list workspaces" },
      { status: 500 }
    );
  }
}
