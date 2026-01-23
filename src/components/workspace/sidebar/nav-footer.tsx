"use client";

import {
  IconAlertTriangle,
  IconHelp,
  IconSettings,
  IconSettingsFilled,
  IconSparkles,
  IconCoins,
  IconKeyboard,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { PricingDialog } from "@/components/pricing/pricing-dialog";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useCreditBalance } from "@/hooks/useCredits";
import { cn } from "@/lib/utils";

interface NavFooterProps {
  currentSlug: string;
}

export function NavFooter({ currentSlug }: NavFooterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: workspace } = useWorkspaceBySlug(currentSlug);
  const { data: credits } = useCreditBalance(workspace?.id);

  const settingsUrl = `/${currentSlug}/settings`;
  const isSettingsActive =
    pathname === settingsUrl || pathname.startsWith(`${settingsUrl}/`);

  const creditBalance = credits?.balance ?? 0;
  const isLowCredits = creditBalance < 10;

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
        // TODO: Open keyboard shortcuts modal
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
      {/* Credits Display */}
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={`${creditBalance} credits remaining`}
          onClick={() => router.push(`/${currentSlug}/settings/billing`)}
          className={cn(
            isLowCredits && "text-amber-600 dark:text-amber-500"
          )}
        >
          <IconCoins className={cn(isLowCredits && "text-amber-500")} />
          <span className="font-[490] text-[13px]">Credits</span>
        </SidebarMenuButton>
        <SidebarMenuBadge
          className={cn(
            isLowCredits
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-500"
              : "bg-primary/10 text-primary"
          )}
        >
          {creditBalance}
        </SidebarMenuBadge>
      </SidebarMenuItem>

      {/* Upgrade Button */}
      <SidebarMenuItem>
        <PricingDialog
          workspaceId={workspace?.id}
          currentPlan={workspace?.plan || "free"}
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
