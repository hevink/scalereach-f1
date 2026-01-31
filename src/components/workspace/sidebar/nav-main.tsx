"use client";

import {
  IconHome,
  IconHomeFilled,
  IconVideo,
  IconVideoFilled,
  IconFolder,
  IconFolderFilled,
  IconScissors,
  IconDownload,
  IconPalette,
  IconPaletteFilled,
  IconTextCaption,
  IconStar,
  IconStarFilled,
  IconClock,
} from "@tabler/icons-react";
import { usePathname, useRouter } from "next/navigation";
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
  const { data: videos } = useMyVideos(workspaceId || "", !!workspaceId);

  // Count videos by status
  const processingCount = videos?.filter(
    (v) => v.status === "downloading" || v.status === "uploading" || v.status === "transcribing" || v.status === "analyzing"
  ).length || 0;

  const mainItems = [
    {
      title: "Home",
      url: `/${currentSlug}`,
      icon: IconHome,
      iconFilled: IconHomeFilled,
      exact: true,
    },
    {
      title: "Videos",
      url: `/${currentSlug}`,
      icon: IconVideo,
      iconFilled: IconVideoFilled,
      exact: true,
      badge: videos?.length,
    },
    {
      title: "Projects",
      url: `/${currentSlug}?tab=projects`,
      icon: IconFolder,
      iconFilled: IconFolderFilled,
      matchPath: (p: string) => p.includes("/projects") || p.includes("tab=projects"),
    },
  ];

  const libraryItems = [
    {
      title: "All Clips",
      url: `/${currentSlug}/clips`,
      icon: IconScissors,
      iconFilled: IconScissors,
    },
    {
      title: "Favorites",
      url: `/${currentSlug}/clips?favorites=true`,
      icon: IconStar,
      iconFilled: IconStarFilled,
      matchPath: (p: string) => p.includes("favorites=true"),
    },
    {
      title: "Exports",
      url: `/${currentSlug}/exports`,
      icon: IconDownload,
      iconFilled: IconDownload,
    },
  ];

  const toolsItems = [
    {
      title: "Brand Kit",
      url: `/${currentSlug}/settings/brand-kit`,
      icon: IconPalette,
      iconFilled: IconPaletteFilled,
    },
    {
      title: "Caption Templates",
      url: `/${currentSlug}/settings/captions`,
      icon: IconTextCaption,
      iconFilled: IconTextCaption,
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
                  <IconClock className="animate-pulse text-amber-500" />
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
    </>
  );
}
