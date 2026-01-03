"use client";

import { IconBuilding } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  role: "owner" | "admin" | "member";
}

interface WorkspaceSelectorProps {
  currentSlug: string;
  workspaces?: Workspace[];
  isLoading?: boolean;
}

export function WorkspaceSelectorSkeleton() {
  return (
    <>
      <Skeleton className="size-8 rounded-lg" />
      <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="size-4" />
    </>
  );
}

export function WorkspaceSelector({
  currentSlug,
  workspaces = [],
  isLoading = false,
}: WorkspaceSelectorProps) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const currentWorkspace = workspaces.find((w) => w.slug === currentSlug);

  const handleWorkspaceChange = (slug: string | null) => {
    if (!slug || slug === currentSlug) {
      return;
    }
    setIsNavigating(true);
    router.push(`/${slug}`);
  };

  if (isLoading) {
    return <WorkspaceSelectorSkeleton />;
  }

  if (workspaces.length === 0) {
    return null;
  }

  return (
    <Select
      disabled={isNavigating}
      onValueChange={handleWorkspaceChange}
      value={currentSlug}
    >
      <SelectTrigger
        aria-label="Select workspace"
        className="w-full justify-between"
        size="sm"
      >
        <SelectValue>
          <div className="flex items-center gap-2">
            <IconBuilding className="size-4 shrink-0" />
            <span className="truncate font-[490] text-sm">
              {currentWorkspace?.name || "Select workspace"}
            </span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.slug}>
            <div className="flex items-center gap-2">
              <IconBuilding className="size-4 shrink-0" />
              <div className="flex flex-col gap-0.5">
                <span className="font-[490] text-sm">{workspace.name}</span>
                {workspace.description && (
                  <span className="text-muted-foreground text-xs">
                    {workspace.description}
                  </span>
                )}
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
