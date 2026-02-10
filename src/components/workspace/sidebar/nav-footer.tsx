"use client";

import {
  IconAlertTriangle,
  IconHelp,
  IconSettings,
  IconSettingsFilled,
  IconSparkles,
  IconClock,
  IconKeyboard,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useMinutesBalance } from "@/hooks/useMinutes";
import { cn } from "@/lib/utils";
import { useWorkspaceShortcuts } from "@/components/workspace/workspace-shortcuts-provider";

interface NavFooterProps {
  currentSlug: string;
}

export function NavFooter({ currentSlug }: NavFooterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: workspace } = useWorkspaceBySlug(currentSlug);
  const { data: minutesData } = useMinutesBalance(workspace?.id);
  const { openShortcutsHelp } = useWorkspaceShortcuts();

  const settingsUrl = `/${currentSlug}/settings`;
  const isSettingsActive =
    pathname === settingsUrl || pathname.startsWith(`${settingsUrl}/`);

  const minutesRemaining = minutesData?.minutesRemaining ?? 0;
  const minutesTotal = minutesData?.minutesTotal ?? 0;
  const isLowMinutes = minutesTotal > 0 && (minutesRemaining / minutesTotal) < 0.2;

  const footerItems = [
    {
      title: "Settings",
      icon: isSettingsActive ? IconSettingsFilled : IconSettings,
      onClick: () => {
        router.push(settingsUrl);
      },
      isActive: isSettingsActive,
    },
    {
      title: "Shortcuts",
      icon: IconKeyboard,
      onClick: () => {
        openShortcutsHelp();
      },
    },
    {
      title: "Get Help",
      icon: IconHelp,
      onClick: () => {
        // TODO: Open help center
      },
    },
    {
      title: "Report Issue",
      icon: IconAlertTriangle,
      onClick: () => {
        // TODO: Open issue reporter
      },
    },
  ];

  return (
    <SidebarMenu>
      {/* Minutes Display */}
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={`${minutesRemaining} min remaining`}
          onClick={() => router.push(`/${currentSlug}/pricing`)}
          className={cn(
            isLowMinutes && "text-amber-600 dark:text-amber-500"
          )}
        >
          <IconClock className={cn(isLowMinutes && "text-amber-500")} />
          <span className="font-[490] text-[13px]">Minutes</span>
        </SidebarMenuButton>
        <SidebarMenuBadge
          className={cn(
            isLowMinutes
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-500"
              : "bg-primary/10 text-primary"
          )}
        >
          {minutesRemaining} min
        </SidebarMenuBadge>
      </SidebarMenuItem>

      {/* Upgrade Button - Links to pricing page */}
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="Upgrade Plan"
          onClick={() => router.push(`/${currentSlug}/pricing`)}
          className="bg-linear-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20"
        >
          <IconSparkles className="text-primary" />
          <span className="font-[490] text-[13px] text-primary">Upgrade</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      {footerItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={item.isActive}
              onClick={item.onClick}
              tooltip={item.title}
            >
              <IconComponent
                className={
                  item.isActive
                    ? "fill-current text-muted-foreground contrast-200"
                    : ""
                }
              />
              <span className="font-[490] text-[13px]">{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
