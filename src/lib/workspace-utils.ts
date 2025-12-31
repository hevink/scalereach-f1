import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { workspace, workspaceMember } from "@/db/schema";
import { getSessionSafe } from "./auth-utils";

export interface WorkspaceAccess {
  workspace: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    ownerId: string;
  };
  role: "owner" | "member";
}

export const getWorkspaceBySlug = cache(
  async (
    slug: string
  ): Promise<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    ownerId: string;
  } | null> => {
    const result = await db
      .select({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        logo: workspace.logo,
        ownerId: workspace.ownerId,
      })
      .from(workspace)
      .where(eq(workspace.slug, slug))
      .limit(1);

    return result[0] || null;
  }
);

export const validateWorkspaceAccess = cache(
  async (
    workspaceSlug: string,
    userId: string
  ): Promise<
    | { success: true; access: WorkspaceAccess }
    | { success: false; error: string; status: number }
  > => {
    const result = await db
      .select({
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        logo: workspace.logo,
        ownerId: workspace.ownerId,
        memberRole: workspaceMember.role,
      })
      .from(workspace)
      .leftJoin(
        workspaceMember,
        and(
          eq(workspaceMember.workspaceId, workspace.id),
          eq(workspaceMember.userId, userId)
        )
      )
      .where(eq(workspace.slug, workspaceSlug))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Workspace not found", status: 404 };
    }

    const data = result[0];

    if (data.ownerId === userId) {
      return {
        success: true,
        access: {
          workspace: {
            id: data.id,
            name: data.name,
            slug: data.slug,
            description: data.description,
            logo: data.logo,
            ownerId: data.ownerId,
          },
          role: "owner",
        },
      };
    }

    // Check if user is a member
    if (!data.memberRole) {
      return {
        success: false,
        error: "You don't have access to this workspace",
        status: 403,
      };
    }

    return {
      success: true,
      access: {
        workspace: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          description: data.description,
          logo: data.logo,
          ownerId: data.ownerId,
        },
        role: data.memberRole as "owner" | "member",
      },
    };
  }
);

export async function requireWorkspaceAccess(
  workspaceSlug: string
): Promise<WorkspaceAccess> {
  const session = await getSessionSafe();

  if (!session) {
    throw new Error("Unauthorized");
  }

  const validation = await validateWorkspaceAccess(
    workspaceSlug,
    session.user.id
  );

  if (!validation.success) {
    throw new Error(validation.error);
  }

  return validation.access;
}

/**
 * Optimized: Uses cached getSessionSafe instead of direct auth.api call
 */
export async function getWorkspaceAccess(
  workspaceSlug: string | null
): Promise<WorkspaceAccess | null> {
  if (!workspaceSlug) {
    return null;
  }

  try {
    const session = await getSessionSafe();

    if (!session) {
      return null;
    }

    const validation = await validateWorkspaceAccess(
      workspaceSlug,
      session.user.id
    );

    if (!validation.success) {
      return null;
    }

    return validation.access;
  } catch {
    return null;
  }
}
