import { eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { workspaceRole, workspaceRolePermission } from "@/db/schema";
import { DEFAULT_ROLE_PERMISSIONS } from "./permissions";

export interface Role {
  id: string;
  workspaceId: string;
  name: string;
  identifier: string;
  isSystem: boolean;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions?: string[];
}

export async function initializeWorkspaceRoles(
  workspaceId: string
): Promise<void> {
  const defaultRoles = [
    {
      name: "Owner",
      identifier: "owner",
      description: "Full control over the workspace",
    },
    {
      name: "Admin",
      identifier: "admin",
      description: "Manage workspace and members",
    },
    {
      name: "Manager",
      identifier: "manager",
      description: "Create and manage projects",
    },
    {
      name: "Member",
      identifier: "member",
      description: "Create and manage tasks",
    },
    { name: "Guest", identifier: "guest", description: "View-only access" },
  ];

  const roleValues = defaultRoles.map((roleData) => ({
    id: crypto.randomUUID(),
    workspaceId,
    name: roleData.name,
    identifier: roleData.identifier,
    isSystem: true,
    description: roleData.description,
  }));

  await db.insert(workspaceRole).values(roleValues);

  const permissionValues: Array<{
    id: string;
    roleId: string;
    permission: string;
  }> = [];

  for (let i = 0; i < defaultRoles.length; i++) {
    const roleId = roleValues[i].id;
    const permissions =
      DEFAULT_ROLE_PERMISSIONS[
        defaultRoles[i].identifier as keyof typeof DEFAULT_ROLE_PERMISSIONS
      ] || [];

    for (const permission of permissions) {
      permissionValues.push({
        id: crypto.randomUUID(),
        roleId,
        permission,
      });
    }
  }

  if (permissionValues.length > 0) {
    await db.insert(workspaceRolePermission).values(permissionValues);
  }
}

export const getWorkspaceRoles = cache(
  async (workspaceId: string): Promise<Role[]> => {
    const roles = await db
      .select()
      .from(workspaceRole)
      .where(eq(workspaceRole.workspaceId, workspaceId))
      .orderBy(workspaceRole.createdAt);

    if (roles.length === 0) {
      return [];
    }

    const roleIds = roles.map((r) => r.id);
    const allPermissions = await db
      .select({
        roleId: workspaceRolePermission.roleId,
        permission: workspaceRolePermission.permission,
      })
      .from(workspaceRolePermission)
      .where(inArray(workspaceRolePermission.roleId, roleIds));

    const permissionsByRoleId = new Map<string, string[]>();
    for (const p of allPermissions) {
      const existing = permissionsByRoleId.get(p.roleId) || [];
      existing.push(p.permission);
      permissionsByRoleId.set(p.roleId, existing);
    }

    return roles.map((role) => ({
      ...role,
      permissions: permissionsByRoleId.get(role.id) || [],
    }));
  }
);

export const getRoleById = cache(
  async (roleId: string): Promise<Role | null> => {
    const [roleResult, permissionsResult] = await Promise.all([
      db
        .select()
        .from(workspaceRole)
        .where(eq(workspaceRole.id, roleId))
        .limit(1),
      db
        .select({ permission: workspaceRolePermission.permission })
        .from(workspaceRolePermission)
        .where(eq(workspaceRolePermission.roleId, roleId)),
    ]);

    if (roleResult.length === 0) {
      return null;
    }

    return {
      ...roleResult[0],
      permissions: permissionsResult.map((p) => p.permission),
    };
  }
);

export async function updateRolePermissions(
  roleId: string,
  permissions: string[]
): Promise<void> {
  await db
    .delete(workspaceRolePermission)
    .where(eq(workspaceRolePermission.roleId, roleId));

  if (permissions.length > 0) {
    await db.insert(workspaceRolePermission).values(
      permissions.map((permission) => ({
        id: crypto.randomUUID(),
        roleId,
        permission,
      }))
    );
  }
}

export async function updateRole(
  roleId: string,
  data: {
    name?: string;
    description?: string | null;
  }
): Promise<void> {
  await db
    .update(workspaceRole)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(workspaceRole.id, roleId));
}
