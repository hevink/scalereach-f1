"use client";

import {
  HugeSettingsIcon,
  HugeSparklesIcon,
  HugeClockIcon,
  HugeHelpIcon,
  HugeAlertIcon,
  HugeKeyboardIcon,
} from "@/components/icons/huge-icons";
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
  const isAgency = workspace?.plan === "agency";
  const isLowMinutes = !isAgency && minutesTotal > 0 && (minutesRemaining / minutesTotal) < 0.2;

  const isFree = workspace?.plan === "free";

  const footerItems = [
    {
      title: "Settings",
      icon: isSettingsActive ? HugeSettingsIcon : HugeSettingsIcon,
      onClick: () => {
        router.push(settingsUrl);
      },
      isActive: isSettingsActive,
    },
    {
      title: "Shortcuts",
      icon: HugeKeyboardIcon,
      onClick: () => {
        openShortcutsHelp();
      },
    },
    {
      title: "Get Help",
      icon: HugeHelpIcon,
      onClick: () => {
        window.open("mailto:hevin@scalereach.ai?subject=Help%20Request", "_blank");
      },
    },
    {
      title: "Report Issue",
      icon: HugeAlertIcon,
      onClick: () => {
        window.open("mailto:hevin@scalereach.ai?subject=Bug%20Report", "_blank");
      },
    },
  ];

  return (
    <SidebarMenu>
      {/* Minutes Display */}
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={isAgency ? "Unlimited minutes (Agency plan)" : `${minutesRemaining} min remaining`}
          onClick={() => router.push(`/${currentSlug}/pricing`)}
          className={cn(isLowMinutes && "text-amber-600 dark:text-amber-500")}
        >
          <HugeClockIcon className={cn(isLowMinutes && "text-amber-500")} />
          <span className="font-[490] text-[13px]">Minutes</span>
        </SidebarMenuButton>
        <SidebarMenuBadge
          className={cn(
            isLowMinutes
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-500"
              : "bg-primary/10 text-primary"
          )}
        >
          {isAgency ? "∞" : `${minutesRemaining} min`}
        </SidebarMenuBadge>
      </SidebarMenuItem>

      {/* Free plan upgrade nudge */}
      {isFree && (
        <SidebarMenuItem>
          <div
            onClick={() => router.push(`/${currentSlug}/pricing`)}
            className="cursor-pointer mx-1 mb-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 hover:bg-primary/10 transition-colors"
          >
            <p className="text-xs font-semibold text-primary mb-0.5">Unlock more minutes</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              500 min/month, no watermark, longer videos.
            </p>
          </div>
        </SidebarMenuItem>
      )}

      {/* Upgrade Button - hide for agency */}
      {!isAgency && (
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Upgrade Plan"
            onClick={() => router.push(`/${currentSlug}/pricing`)}
            className="bg-linear-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20"
          >
            <HugeSparklesIcon className="text-primary" />
            <span className="font-[490] text-[13px] text-primary">Upgrade</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

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
