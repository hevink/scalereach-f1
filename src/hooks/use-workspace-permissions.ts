"use client";

import { useEffect, useState } from "react";
import type { PermissionKey } from "@/lib/permissions";

export function useWorkspacePermissions(workspaceId: string | null) {
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    fetch(`/api/workspace/${workspaceId}/permissions`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch permissions");
        }
        const data = await res.json();
        setPermissions(data.permissions || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Unknown error");
        setPermissions([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [workspaceId]);

  const hasPermission = (permission: PermissionKey | string): boolean => {
    return permissions.includes(permission as PermissionKey);
  };

  return {
    permissions,
    hasPermission,
    isLoading,
    error,
  };
}
