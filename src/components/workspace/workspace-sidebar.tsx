"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavFooter } from "./sidebar/nav-footer";
import { NavMain } from "./sidebar/nav-main";
import { NavUser } from "./sidebar/nav-user";
import { WorkspaceSwitcher } from "./sidebar/workspace-switcher";
import { useWorkspaces, useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

interface WorkspaceSidebarProps {
  currentSlug: string;
}

export function WorkspaceSidebar({ currentSlug }: WorkspaceSidebarProps) {
  const { data: workspaces = [], isLoading } = useWorkspaces();
  const { data: currentWorkspace } = useWorkspaceBySlug(currentSlug);
  const queryClient = useQueryClient();

  const handleWorkspaceCreated = useCallback(
    (_workspace: { id: string; name: string; slug: string }) => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
    },
    [queryClient]
  );

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <WorkspaceSwitcher
          currentSlug={currentSlug}
          isLoading={isLoading}
          onWorkspaceCreated={handleWorkspaceCreated}
          workspaces={workspaces}
        />
      </SidebarHeader>
      <SidebarContent>
        <NavMain currentSlug={currentSlug} workspaceId={currentWorkspace?.id} />
      </SidebarContent>
      <SidebarFooter>
        <NavFooter currentSlug={currentSlug} />
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
