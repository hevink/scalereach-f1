"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { CollapsibleGroup } from "./collapsible-group";
import { NavLink } from "./nav-link";
import { IconFolder } from "@tabler/icons-react";
import { buildWorkspaceUrl, isWorkspaceRouteActive } from "./utils";

interface WorkspaceSectionProps {
    workspaceSlug: string | null;
    pathname: string;
    isLoading?: boolean;
}

export function WorkspaceSection({
    workspaceSlug,
    pathname,
    isLoading = false,
}: WorkspaceSectionProps) {
    if (!workspaceSlug) {
        return null;
    }

    const projectHref = buildWorkspaceUrl(workspaceSlug, "/projects");
    const isProjectActive = isWorkspaceRouteActive(pathname, workspaceSlug, "/projects");

    return (
        <CollapsibleGroup
            defaultOpen={true}
            label="Workspace"
        >
            {isLoading ? (
                <div className="flex flex-col gap-0.5">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="flex items-center gap-2 rounded-md px-2 py-1.5"
                        >
                            <Skeleton className="size-4 shrink-0" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    ))}
                </div>
            ) : (
                <NavLink
                    href={projectHref}
                    icon={<IconFolder className="size-4 shrink-0" />}
                    isActive={isProjectActive}
                >
                    <span className="font-[480]">Projects</span>
                </NavLink>
            )}
        </CollapsibleGroup>
    );
}

