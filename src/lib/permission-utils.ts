import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  workspace,
  workspaceMember,
  workspaceRole,
  workspaceRolePermission,
} from "@/db/schema";
import type { PermissionKey } from "./permissions";

export async function getUserWorkspacePermissions(
  workspaceId: string,
  userId: string
): Promise<PermissionKey[]> {
  const workspaceData = await db
    .select({ ownerId: workspace.ownerId })
    .from(workspace)
    .where(eq(workspace.id, workspaceId))
    .limit(1);

  if (workspaceData.length === 0) {
    return [];
  }

  if (workspaceData[0].ownerId === userId) {
    const ownerRole = await db
      .select({ id: workspaceRole.id })
      .from(workspaceRole)
      .where(
        and(
          eq(workspaceRole.workspaceId, workspaceId),
          eq(workspaceRole.identifier, "owner")
        )
      )
      .limit(1);

    if (ownerRole.length > 0) {
      const permissions = await db
        .select({ permission: workspaceRolePermission.permission })
        .from(workspaceRolePermission)
        .where(eq(workspaceRolePermission.roleId, ownerRole[0].id));

      return permissions.map((p) => p.permission as PermissionKey);
    }
  }

  const member = await db
    .select({ role: workspaceMember.role })
    .from(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, workspaceId),
        eq(workspaceMember.userId, userId)
      )
    )
    .limit(1);

  if (member.length === 0) {
    return [];
  }

  const roleIdentifier = member[0].role;

  const role = await db
    .select({ id: workspaceRole.id })
    .from(workspaceRole)
    .where(
      and(
        eq(workspaceRole.workspaceId, workspaceId),
        eq(workspaceRole.identifier, roleIdentifier)
      )
    )
    .limit(1);

  if (role.length === 0) {
    return [];
  }

  const permissions = await db
    .select({ permission: workspaceRolePermission.permission })
    .from(workspaceRolePermission)
    .where(eq(workspaceRolePermission.roleId, role[0].id));

  return permissions.map((p) => p.permission as PermissionKey);
}

export async function hasPermission(
  workspaceId: string,
  userId: string,
  permission: PermissionKey
): Promise<boolean> {
  const permissions = await getUserWorkspacePermissions(workspaceId, userId);
  return permissions.includes(permission);
}
