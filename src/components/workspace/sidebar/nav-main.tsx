"use client";

import {
  HugeVideoIcon,
  HugeScissorIcon,
  HugeStarIcon,
  HugeClockIcon,
} from "@/components/icons/huge-icons";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import { useMyVideos } from "@/hooks/useVideo";

interface NavMainProps {
  currentSlug: string;
  workspaceId?: string;
}

export function NavMain({ currentSlug, workspaceId }: NavMainProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: videos } = useMyVideos(workspaceId || "", !!workspaceId);

  // Count videos by status
  const processingCount = videos?.filter(
    (v) => v.status === "downloading" || v.status === "uploading" || v.status === "transcribing" || v.status === "analyzing"
  ).length || 0;

  const mainItems = [
    {
      title: "Videos",
      url: `/${currentSlug}`,
      icon: HugeVideoIcon,
      iconFilled: HugeVideoIcon,
      exact: true,
      badge: videos?.length,
    },
    // TEMPORARILY COMMENTED - Projects
    // {
    //   title: "Projects",
    //   url: `/${currentSlug}?tab=projects`,
    //   icon: IconFolder,
    //   iconFilled: IconFolderFilled,
    //   matchPath: (p: string) => p.includes("/projects") || p.includes("tab=projects"),
    // },
  ];

  const libraryItems = [
    {
      title: "All Clips",
      url: `/${currentSlug}/clips`,
      icon: HugeScissorIcon,
      iconFilled: HugeScissorIcon,
      matchPath: (p: string) => p.includes("/clips") && !searchParams.get("favorites"),
    },
    {
      title: "Favorites",
      url: `/${currentSlug}/clips?favorites=true`,
      icon: HugeStarIcon,
      iconFilled: HugeStarIcon,
      matchPath: () => searchParams.get("favorites") === "true",
    },

  ];

  const toolsItems = [
    {
      title: "Minute Usage",
      url: `/${currentSlug}/credits`,
      icon: HugeClockIcon,
      matchPath: (p: string) => p.includes("/credits"),
    },
  ];

  const isActive = (item: { url: string; exact?: boolean; matchPath?: (p: string) => boolean }) => {
    if (item.matchPath) {
      return item.matchPath(pathname);
    }
    if (item.exact) {
      return pathname === item.url;
    }
    return pathname.startsWith(item.url);
  };

  return (
    <>
      {/* Main Navigation */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainItems.map((item) => {
              const active = isActive(item);
              const IconComponent = active ? item.iconFilled : item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={active}
                    onClick={() => router.push(item.url)}
                    tooltip={item.title}
                  >
                    <IconComponent
                      className={
                        active
                          ? "fill-current text-muted-foreground contrast-200"
                          : ""
                      }
                    />
                    <span className="font-[490] text-[13px]">{item.title}</span>
                  </SidebarMenuButton>
                  {item.badge !== undefined && item.badge > 0 && (
                    <SidebarMenuBadge>{item.badge}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Processing Queue - Show only when there are processing videos */}
      {processingCount > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>Processing</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => router.push(`/${currentSlug}?filter=processing`)}
                  tooltip="Processing Queue"
                >
                  <HugeClockIcon className="animate-pulse text-amber-500" />
                  <span className="font-[490] text-[13px]">In Progress</span>
                </SidebarMenuButton>
                <SidebarMenuBadge className="bg-amber-500/10 text-amber-600">
                  {processingCount}
                </SidebarMenuBadge>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Library */}
      <SidebarGroup>
        <SidebarGroupLabel>Library</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {libraryItems.map((item) => {
              const active = isActive(item);
              const IconComponent = active ? item.iconFilled : item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={active}
                    onClick={() => router.push(item.url)}
                    tooltip={item.title}
                  >
                    <IconComponent
                      className={
                        active
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
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Tools */}
      <SidebarGroup>
        <SidebarGroupLabel>Tools</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {toolsItems.map((item) => {
              const active = isActive(item);
              const IconComponent = item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    isActive={active}
                    onClick={() => router.push(item.url)}
                    tooltip={item.title}
                  >
                    <IconComponent />
                    <span className="font-[490] text-[13px]">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </>
  );
}
