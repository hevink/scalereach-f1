"use client";

import { IconAlertTriangle, IconHelp, IconSettings } from "@tabler/icons-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavFooter() {
  const footerItems = [
    {
      title: "Settings",
      icon: IconSettings,
      onClick: () => {
        // No action needed
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
      {footerItems.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton onClick={item.onClick} tooltip={item.title}>
            <item.icon />
            <span className="font-[490] text-sm">{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
