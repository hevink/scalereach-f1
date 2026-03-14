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
  useSidebar,
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
  const { isMobile, setOpenMobile } = useSidebar();
  const { data: workspace } = useWorkspaceBySlug(currentSlug);

  const navigate = (url: string) => {
    router.push(url);
    if (isMobile) setOpenMobile(false);
  };
  const { data: minutesData } = useMinutesBalance(workspace?.id);
  const { openShortcutsHelp } = useWorkspaceShortcuts();

  const settingsUrl = `/${currentSlug}/settings`;
  const isSettingsActive =
    pathname === settingsUrl || pathname.startsWith(`${settingsUrl}/`);

  const minutesRemaining = minutesData?.minutesRemaining ?? 0;
  const minutesTotal = minutesData?.minutesTotal ?? 0;
  const isAgency = workspace?.plan === "agency";
  const isUnlimited = minutesData?.minutesRemaining === -1 || minutesData?.minutesTotal === -1;
  const isLowMinutes = !isUnlimited && minutesTotal > 0 && (minutesRemaining / minutesTotal) < 0.2;

  const isFree = workspace?.plan === "free";

  const footerItems = [
    {
      title: "Settings",
      icon: isSettingsActive ? HugeSettingsIcon : HugeSettingsIcon,
      onClick: () => {
        navigate(settingsUrl);
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
        if (window.$crisp) window.$crisp.push(["do", "chat:open"]);
      },
    },
    {
      title: "Report Issue",
      icon: HugeAlertIcon,
      onClick: () => {
        if (window.$crisp) window.$crisp.push(["do", "chat:open"]);
      },
    },
  ];

  return (
    <SidebarMenu>
      {/* Minutes Display */}
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip={isUnlimited ? "Unlimited minutes" : `${minutesRemaining} min remaining`}
          onClick={() => navigate(`/${currentSlug}/pricing`)}
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
          {isUnlimited ? "∞" : `${minutesRemaining} min`}
        </SidebarMenuBadge>
      </SidebarMenuItem>

      {/* Free plan upgrade nudge - detailed card for free users */}
      {isFree && (
        <SidebarMenuItem className="my-1">
          <SidebarMenuButton
            tooltip="Upgrade to Pro: 400 min/month, no watermark, longer videos"
            onClick={() => navigate(`/${currentSlug}/pricing`)}
            className="h-auto py-2 bg-linear-to-r from-primary/10 to-primary/5 border border-primary/20 hover:from-primary/15 hover:to-primary/10"
          >
            <HugeSparklesIcon className="text-primary shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-xs font-semibold text-primary">Unlock more minutes</span>
              <span className="text-[11px] text-muted-foreground leading-tight truncate">
                400 min/month, no watermark
              </span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}

      {/* Upgrade Button - show for paid non-agency users */}
      {!isFree && !isAgency && (
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip="Upgrade Plan"
            onClick={() => navigate(`/${currentSlug}/pricing`)}
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
