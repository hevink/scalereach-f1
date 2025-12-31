import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { workspace } from "@/db/schema";
import { auth } from "@/lib/auth";
import { safeError } from "@/lib/logger";
import {
  validateBodySize,
  validateParsedBodySize,
} from "@/lib/request-validation";
import {
  getRoleById,
  updateRole,
  updateRolePermissions,
} from "@/lib/role-utils";
import { requireWorkspaceAccess } from "@/lib/workspace-utils";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ workspaceId: string; roleId: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { workspaceId, roleId } = await params;

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

    const role = await getRoleById(roleId);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Role not found in this workspace" },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    safeError("Error fetching role:", error);
    return NextResponse.json(
      { error: "Failed to fetch role" },
      { status: 500 }
    );
  }
}

function validatePermissions(permissions: unknown): NextResponse | null {
  if (permissions !== undefined && !Array.isArray(permissions)) {
    return NextResponse.json(
      { error: "Permissions must be an array" },
      { status: 400 }
    );
  }
  return null;
}

async function updateSystemRole(
  roleId: string,
  body: { permissions?: unknown }
): Promise<NextResponse> {
  const permissionError = validatePermissions(body.permissions);
  if (permissionError) {
    return permissionError;
  }

  if (body.permissions !== undefined) {
    await updateRolePermissions(roleId, body.permissions as string[]);
  }

  const updatedRole = await getRoleById(roleId);
  return NextResponse.json({ role: updatedRole });
}

async function updateRegularRole(
  roleId: string,
  body: {
    name?: string;
    description?: string;
    permissions?: unknown;
  }
): Promise<NextResponse> {
  if (body.name !== undefined || body.description !== undefined) {
    await updateRole(roleId, {
      name: body.name?.trim(),
      description: body.description?.trim() || null,
    });
  }

  const permissionError = validatePermissions(body.permissions);
  if (permissionError) {
    return permissionError;
  }

  if (body.permissions !== undefined) {
    await updateRolePermissions(roleId, body.permissions as string[]);
  }

  const updatedRole = await getRoleById(roleId);
  return NextResponse.json({ role: updatedRole });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; roleId: string }> }
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

    const { workspaceId, roleId } = await params;

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

    const access = await requireWorkspaceAccess(workspaceData[0].slug);

    // Only owners can manage roles
    if (access.role !== "owner") {
      return NextResponse.json(
        { error: "Only workspace owners can manage roles" },
        { status: 403 }
      );
    }

    const role = await getRoleById(roleId);

    if (!role) {
      return NextResponse.json({ error: "Role not found" }, { status: 404 });
    }

    if (role.workspaceId !== workspaceId) {
      return NextResponse.json(
        { error: "Role not found in this workspace" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsedSizeError = validateParsedBodySize(body);
    if (parsedSizeError) {
      return parsedSizeError;
    }

    // System roles cannot have their name or identifier changed
    if (role.isSystem) {
      return updateSystemRole(roleId, body);
    }

    return updateRegularRole(roleId, body);
  } catch (error) {
    safeError("Error updating role:", error);
    return NextResponse.json(
      { error: "Failed to update role" },
      { status: 500 }
    );
  }
}
