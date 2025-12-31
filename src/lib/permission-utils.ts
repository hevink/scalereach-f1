import { and, eq } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import {
  workspace,
  workspaceMember,
  workspaceRole,
  workspaceRolePermission,
} from "@/db/schema";
import type { PermissionKey } from "./permissions";

export const getUserWorkspacePermissions = cache(
  async (workspaceId: string, userId: string): Promise<PermissionKey[]> => {
    const [workspaceData, memberData] = await Promise.all([
      db
        .select({ ownerId: workspace.ownerId })
        .from(workspace)
        .where(eq(workspace.id, workspaceId))
        .limit(1),
      db
        .select({ role: workspaceMember.role })
        .from(workspaceMember)
        .where(
          and(
            eq(workspaceMember.workspaceId, workspaceId),
            eq(workspaceMember.userId, userId)
          )
        )
        .limit(1),
    ]);

    if (workspaceData.length === 0) {
      return [];
    }

    const isOwner = workspaceData[0].ownerId === userId;
    let roleIdentifier: string | null;
    if (isOwner) {
      roleIdentifier = "owner";
    } else if (memberData.length > 0) {
      roleIdentifier = memberData[0].role;
    } else {
      roleIdentifier = null;
    }

    if (!roleIdentifier) {
      return [];
    }

    const permissions = await db
      .select({ permission: workspaceRolePermission.permission })
      .from(workspaceRolePermission)
      .innerJoin(
        workspaceRole,
        eq(workspaceRolePermission.roleId, workspaceRole.id)
      )
      .where(
        and(
          eq(workspaceRole.workspaceId, workspaceId),
          eq(workspaceRole.identifier, roleIdentifier)
        )
      );

    return permissions.map((p) => p.permission as PermissionKey);
  }
);

export async function hasPermission(
  workspaceId: string,
  userId: string,
  permission: PermissionKey
): Promise<boolean> {
  const permissions = await getUserWorkspacePermissions(workspaceId, userId);
  return permissions.includes(permission);
}
