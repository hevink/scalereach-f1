"use client";

import {
  IconBell,
  IconChevronRight,
  IconHome,
  IconInbox,
  IconPlus,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  type NavItem,
  SidebarContent as SidebarContentContainer,
  SidebarNavMenu,
} from "@/components/ui/sidebar";
import { useInvitationsCount } from "@/hooks/use-invitations-count";
import { safeClientError } from "@/lib/client-logger";
import { TeamsSection } from "./teams-section";
import { WorkspaceSection } from "./workspace-section";

interface SidebarContentProps {
  pathname: string;
  workspaceSlug: string | null;
}

export function SidebarContent({
  pathname,
  workspaceSlug,
}: SidebarContentProps) {
  const { count: invitationCount } = useInvitationsCount();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchWorkspaceId = async () => {
      if (!workspaceSlug) {
        setWorkspaceId(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/workspace/by-slug?slug=${encodeURIComponent(workspaceSlug)}`
        );
        const data = await response.json();

        if (response.ok && data.workspace) {
          setWorkspaceId(data.workspace.id);
        } else {
          setWorkspaceId(null);
        }
      } catch (error) {
        safeClientError("Error fetching workspace:", error);
        setWorkspaceId(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspaceId();
  }, [workspaceSlug]);

  const mainNavItems: NavItem[] = [
    { href: "/", icon: IconHome, label: "Home" },
    {
      href: "/activity",
      icon: IconInbox,
      label: "Activity",
    },
    {
      href: "/notifications",
      icon: IconBell,
      label: "Notifications",
      isWorkspaceAware: false,
      notificationCount: invitationCount,
    },
  ];

  return (
    <SidebarContentContainer>
      <SidebarNavMenu
        items={mainNavItems}
        pathname={pathname}
        workspaceSlug={workspaceSlug}
      />
      {workspaceSlug && (
        <>
          <WorkspaceSection
            isLoading={isLoading}
            pathname={pathname}
            workspaceSlug={workspaceSlug}
          />
          {isLoading ? (
            <div className="flex flex-col">
              <div className="flex w-full items-center justify-between rounded-md px-2 py-1.5">
                <button
                  className="flex flex-1 items-center gap-2 font-medium text-muted-foreground text-sm transition-colors hover:text-foreground"
                  disabled
                  type="button"
                >
                  <span>Your teams</span>
                  <IconChevronRight className="size-3 shrink-0" />
                </button>
                <div>
                  <Button
                    className="size-6 p-0"
                    disabled
                    size="icon"
                    variant="ghost"
                  >
                    <IconPlus className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <TeamsSection
              pathname={pathname}
              workspaceId={workspaceId}
              workspaceSlug={workspaceSlug}
            />
          )}
        </>
      )}
    </SidebarContentContainer>
  );
}
