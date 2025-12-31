"use client";

import type { HTMLAttributes, ReactElement, ReactNode } from "react";
import { cloneElement } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions";
import type { PermissionKey } from "@/lib/permissions";

interface PermissionGateProps {
  workspaceId: string | null;
  permission: PermissionKey | string;
  children: ReactElement<HTMLAttributes<HTMLElement> & { disabled?: boolean }>;
  fallback?: ReactNode;
  showTooltip?: boolean;
}

export function PermissionGate({
  workspaceId,
  permission,
  children,
  fallback,
  showTooltip = true,
}: PermissionGateProps) {
  const { hasPermission, isLoading } = useWorkspacePermissions(workspaceId);

  const childProps = children.props as HTMLAttributes<HTMLElement> & {
    disabled?: boolean;
  };

  const shouldDisable = isLoading || !hasPermission(permission);
  const showTooltipMessage =
    !(isLoading || hasPermission(permission)) && showTooltip;

  if (!(isLoading || hasPermission(permission)) && fallback) {
    return <>{fallback}</>;
  }

  const disabledChild = cloneElement(children, {
    ...childProps,
    disabled: shouldDisable || childProps.disabled,
    "aria-disabled": shouldDisable || childProps.disabled,
    className: `${childProps.className || ""}${shouldDisable && !childProps.disabled ? " opacity-50 cursor-not-allowed" : ""}${showTooltipMessage ? " pointer-events-none" : ""}`,
  } as HTMLAttributes<HTMLElement> & { disabled?: boolean });

  if (showTooltipMessage) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger
            render={(props) => (
              <div {...props} className="inline-flex">
                {disabledChild}
              </div>
            )}
          />
          <TooltipContent>
            <p>You don't have permission to perform this action</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return shouldDisable ? disabledChild : children;
}
