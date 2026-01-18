"use client";

import {
  IconAlertTriangle,
  IconHelp,
  IconSettings,
  IconSettingsFilled,
  IconSparkles,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { PricingDialog } from "@/components/pricing/pricing-dialog";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";

interface NavFooterProps {
  currentSlug: string;
}

export function NavFooter({ currentSlug }: NavFooterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: workspace } = useWorkspaceBySlug(currentSlug);

  const settingsUrl = `/${currentSlug}/settings`;
  const isSettingsActive =
    pathname === settingsUrl || pathname.startsWith(`${settingsUrl}/`);

  const footerItems = [
    {
      title: "Settings",
      icon: isSettingsActive ? IconSettingsFilled : IconSettings,
      onClick: () => {
        router.push(settingsUrl);
      },
    },
    {
      title: "Get Help",
      icon: IconHelp,
      onClick: () => {
        // No action needed
      },
    },
    {
      title: "Report",
      icon: IconAlertTriangle,
      onClick: () => {
        // No action needed
      },
    },
  ];

  return (
    <SidebarMenu>
      {/* Upgrade Button */}
      <SidebarMenuItem>
        <PricingDialog
          workspaceId={workspace?.id}
          currentPlan="free"
          trigger={
            <SidebarMenuButton
              tooltip="Upgrade Plan"
              className="bg-linear-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20"
            >
              <IconSparkles className="text-primary" />
              <span className="font-[490] text-[13px] text-primary">Upgrade</span>
            </SidebarMenuButton>
          }
        />
      </SidebarMenuItem>

      {footerItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              isActive={item.title === "Settings" ? isSettingsActive : false}
              onClick={item.onClick}
              tooltip={item.title}
            >
              <IconComponent
                className={
                  item.title === "Settings" && isSettingsActive
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
