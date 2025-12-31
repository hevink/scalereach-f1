import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { user, workspace, workspaceMember } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";
import {
  validateBodySize,
  validateParsedBodySize,
} from "@/lib/request-validation";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;

    const workspaceData = await db
      .select({
        id: workspace.id,
        slug: workspace.slug,
        ownerId: workspace.ownerId,
      })
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const ws = workspaceData[0];

    if (ws.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only workspace owners can remove members" },
        { status: 403 }
      );
    }

    const memberToRemove = await db
      .select({
        id: workspaceMember.id,
        userId: workspaceMember.userId,
      })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.id, memberId),
          eq(workspaceMember.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (memberToRemove.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (memberToRemove[0].userId === ws.ownerId) {
      return NextResponse.json(
        { error: "Cannot remove workspace owner" },
        { status: 400 }
      );
    }

    await db
      .delete(workspaceMember)
      .where(
        and(
          eq(workspaceMember.id, memberId),
          eq(workspaceMember.workspaceId, workspaceId)
        )
      );

    return NextResponse.json({
      message: "Member removed successfully",
    });
  } catch (error) {
    safeError("Error removing member:", error);
    return NextResponse.json(
      { error: "Failed to remove member" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  try {
    const sizeError = validateBodySize(request);
    if (sizeError) {
      return sizeError;
    }

    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, memberId } = await params;

    const workspaceData = await db
      .select({
        id: workspace.id,
        slug: workspace.slug,
        ownerId: workspace.ownerId,
      })
      .from(workspace)
      .where(eq(workspace.id, workspaceId))
      .limit(1);

    if (workspaceData.length === 0) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const ws = workspaceData[0];

    if (ws.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: "Only workspace owners can update member roles" },
        { status: 403 }
      );
    }

    const memberToUpdate = await db
      .select({
        id: workspaceMember.id,
        userId: workspaceMember.userId,
        role: workspaceMember.role,
      })
      .from(workspaceMember)
      .where(
        and(
          eq(workspaceMember.id, memberId),
          eq(workspaceMember.workspaceId, workspaceId)
        )
      )
      .limit(1);

    if (memberToUpdate.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (memberToUpdate[0].userId === ws.ownerId) {
      return NextResponse.json(
        { error: "Cannot change workspace owner role" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsedSizeError = validateParsedBodySize(body);
    if (parsedSizeError) {
      return parsedSizeError;
    }

    const { role } = body;

    if (!role || typeof role !== "string") {
      return NextResponse.json(
        { error: "Role is required and must be a string" },
        { status: 400 }
      );
    }

    // Validate role is one of the allowed values
    const allowedRoles = ["owner", "admin", "manager", "member", "guest"];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: `Role must be one of: ${allowedRoles.join(", ")}` },
        { status: 400 }
      );
    }

    await db
      .update(workspaceMember)
      .set({ role })
      .where(
        and(
          eq(workspaceMember.id, memberId),
          eq(workspaceMember.workspaceId, workspaceId)
        )
      );

    const updatedMember = await db
      .select({
        id: workspaceMember.id,
        userId: workspaceMember.userId,
        role: workspaceMember.role,
        createdAt: workspaceMember.createdAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(workspaceMember)
      .innerJoin(user, eq(workspaceMember.userId, user.id))
      .where(eq(workspaceMember.id, memberId))
      .limit(1);

    return NextResponse.json({
      member: {
        ...updatedMember[0],
        createdAt: updatedMember[0].createdAt
          ? updatedMember[0].createdAt.toISOString()
          : null,
      },
    });
  } catch (error) {
    safeError("Error updating member role:", error);
    return NextResponse.json(
      { error: "Failed to update member role" },
      { status: 500 }
    );
  }
}
