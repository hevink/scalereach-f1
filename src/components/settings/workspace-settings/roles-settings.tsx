"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { PermissionGate } from "@/components/ui/permission-gate";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import { safeClientError } from "@/lib/client-logger";
import { PERMISSION_CATEGORIES, PERMISSIONS } from "@/lib/permissions";

interface Role {
  id: string;
  workspaceId: string;
  name: string;
  identifier: string;
  isSystem: boolean;
  description: string | null;
  permissions?: string[];
}

interface RolesSettingsProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  userRole: "owner" | "member";
}

export function RolesSettings({
  workspace,
  userRole: _userRole,
}: RolesSettingsProps) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [savingRole, setSavingRole] = useState<string | null>(null);
  const { hasPermission } = useWorkspacePermissions(workspace.id);
  const canManageRoles = hasPermission(PERMISSIONS.WORKSPACE.MANAGE_ROLES);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/workspace/${workspace.id}/roles`);
      const data = await response.json();

      if (response.ok && data.roles) {
        setRoles(data.roles);
      } else {
        toast.error(data.error || "Failed to fetch roles");
      }
    } catch (error) {
      safeClientError("Error fetching roles:", error);
      toast.error("Failed to fetch roles");
    } finally {
      setIsLoading(false);
    }
  }, [workspace.id]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handlePermissionToggle = (
    roleId: string,
    permission: string,
    checked: boolean
  ) => {
    if (!canManageRoles) {
      return;
    }

    setRoles((prevRoles) =>
      prevRoles.map((role) => {
        if (role.id !== roleId) {
          return role;
        }

        const currentPermissions = role.permissions || [];
        const newPermissions = checked
          ? [...currentPermissions, permission]
          : currentPermissions.filter((p) => p !== permission);

        return {
          ...role,
          permissions: newPermissions,
        };
      })
    );
  };

  const handleSaveRole = async (roleId: string) => {
    if (!canManageRoles) {
      return;
    }

    const role = roles.find((r) => r.id === roleId);
    if (!role) {
      return;
    }

    setSavingRole(roleId);
    try {
      const response = await fetch(
        `/api/workspace/${workspace.id}/roles/${roleId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            permissions: role.permissions || [],
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Role permissions updated successfully");
        setEditingRole(null);
      } else {
        toast.error(data.error || "Failed to update role");
        // Revert changes
        fetchRoles();
      }
    } catch (error) {
      safeClientError("Error updating role:", error);
      toast.error("Failed to update role");
      fetchRoles();
    } finally {
      setSavingRole(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex max-w-xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-medium text-xl">Roles & Permissions</h1>
        </div>
        <div className="flex flex-col gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-9 w-32" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4">
                  {[1, 2].map((j) => (
                    <div key={j}>
                      <Skeleton className="mb-2 h-4 w-24" />
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 5].map((k) => (
                          <Skeleton className="h-6 w-24 rounded-md" key={k} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-medium text-xl">Roles & Permissions</h1>
      </div>

      <div className="flex flex-col gap-6">
        {roles.map((role) => {
          const isEditing = editingRole === role.id;
          const isSaving = savingRole === role.id;

          return (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <CardTitle className="flex items-center gap-2">
                      {role.name}
                      {role.isSystem && (
                        <span className="font-normal text-muted-foreground text-xs">
                          (System)
                        </span>
                      )}
                    </CardTitle>
                    {role.description && (
                      <CardDescription>{role.description}</CardDescription>
                    )}
                  </div>
                  {!isEditing && (
                    <PermissionGate
                      permission={PERMISSIONS.WORKSPACE.MANAGE_ROLES}
                      workspaceId={workspace.id}
                    >
                      <Button
                        onClick={() => setEditingRole(role.id)}
                        size="sm"
                        variant="outline"
                      >
                        Edit Permissions
                      </Button>
                    </PermissionGate>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="flex flex-col gap-6">
                    {PERMISSION_CATEGORIES.map((category, categoryIndex) => (
                      <div key={category.label}>
                        <h3 className="mb-3 font-medium text-sm">
                          {category.label}
                        </h3>
                        <div className="flex flex-col gap-3">
                          {category.permissions.map((perm) => {
                            const hasPermission = role.permissions?.includes(
                              perm.key
                            );

                            return (
                              <PermissionGate
                                fallback={
                                  <div className="flex items-center gap-2 opacity-50">
                                    <Checkbox
                                      checked={hasPermission}
                                      disabled
                                      id={`${role.id}-${perm.key}`}
                                    />
                                    <Label
                                      className="font-normal"
                                      htmlFor={`${role.id}-${perm.key}`}
                                    >
                                      {perm.label}
                                    </Label>
                                  </div>
                                }
                                key={perm.key}
                                permission={PERMISSIONS.WORKSPACE.MANAGE_ROLES}
                                workspaceId={workspace.id}
                              >
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={hasPermission}
                                    disabled={isSaving}
                                    id={`${role.id}-${perm.key}`}
                                    onCheckedChange={(checked) =>
                                      handlePermissionToggle(
                                        role.id,
                                        perm.key,
                                        checked === true
                                      )
                                    }
                                  />
                                  <Label
                                    className="cursor-pointer font-normal"
                                    htmlFor={`${role.id}-${perm.key}`}
                                  >
                                    {perm.label}
                                  </Label>
                                </div>
                              </PermissionGate>
                            );
                          })}
                        </div>
                        {categoryIndex < PERMISSION_CATEGORIES.length - 1 && (
                          <Separator className="mt-4" />
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2 pt-2">
                      <PermissionGate
                        permission={PERMISSIONS.WORKSPACE.MANAGE_ROLES}
                        workspaceId={workspace.id}
                      >
                        <Button
                          disabled={isSaving}
                          loading={isSaving}
                          onClick={() => handleSaveRole(role.id)}
                        >
                          Save Changes
                        </Button>
                      </PermissionGate>
                      <Button
                        disabled={isSaving}
                        onClick={() => {
                          setEditingRole(null);
                          fetchRoles();
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {PERMISSION_CATEGORIES.map((category) => {
                      const categoryPermissions =
                        role.permissions?.filter((p) =>
                          category.permissions.some((cp) => cp.key === p)
                        ) || [];

                      if (categoryPermissions.length === 0) {
                        return null;
                      }

                      return (
                        <div key={category.label}>
                          <h4 className="mb-2 font-medium text-muted-foreground text-sm">
                            {category.label}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {categoryPermissions.map((permKey) => {
                              const perm = category.permissions.find(
                                (p) => p.key === permKey
                              );
                              return perm ? (
                                <div
                                  className="flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1"
                                  key={permKey}
                                >
                                  <span className="text-muted-foreground text-xs">
                                    {perm.label}
                                  </span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      );
                    })}
                    {!role.permissions || role.permissions.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No permissions assigned
                      </p>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
