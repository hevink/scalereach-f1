import { and, eq, gt, isNull, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, workspace, workspaceInvitation } from "@/db/schema";
import { getSessionSafe } from "@/lib/auth-utils";
import { safeError } from "@/lib/logger";

export async function GET() {
  try {
    const session = await getSessionSafe();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    const now = new Date();

    const invitations = await db
      .select({
        id: workspaceInvitation.id,
        workspaceId: workspaceInvitation.workspaceId,
        email: workspaceInvitation.email,
        status: workspaceInvitation.status,
        createdAt: workspaceInvitation.createdAt,
        expiresAt: workspaceInvitation.expiresAt,
        workspace: {
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
        },
        inviter: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      })
      .from(workspaceInvitation)
      .innerJoin(workspace, eq(workspaceInvitation.workspaceId, workspace.id))
      .innerJoin(user, eq(workspaceInvitation.invitedBy, user.id))
      .where(
        and(
          eq(workspaceInvitation.email, userEmail),
          eq(workspaceInvitation.status, "pending"),
          or(
            isNull(workspaceInvitation.expiresAt),
            gt(workspaceInvitation.expiresAt, now)
          )
        )
      )
      .orderBy(workspaceInvitation.createdAt)
      .limit(100);

    return NextResponse.json(
      { invitations },
      {
        headers: {
          "Cache-Control": "private, max-age=30",
        },
      }
    );
  } catch (error) {
    safeError("Error fetching invitations:", error);
    return NextResponse.json(
      { error: "Failed to fetch invitations" },
      { status: 500 }
    );
  }
}
