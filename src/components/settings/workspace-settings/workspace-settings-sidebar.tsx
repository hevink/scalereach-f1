"use client";

import {
  IconAlertTriangle,
  IconChevronLeft,
  IconSettings,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

interface NavLinkProps {
  href: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
  isActive: boolean;
}

function NavLink({ href, icon: Icon, children, isActive }: NavLinkProps) {
  return (
    <li className="flex w-full items-center">
      <Link
        className={`flex w-full items-center gap-2 rounded px-2 py-1.5 font-[450] text-[13px] transition-colors ${
          isActive ? "bg-accent text-foreground" : "hover:bg-accent"
        }`}
        href={href}
      >
        <Icon className="size-4" /> {children}
      </Link>
    </li>
  );
}

interface NavMenuProps {
  items: Array<{
    href: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    label: string;
    isActive: boolean;
  }>;
}

function NavMenu({ items }: NavMenuProps) {
  return (
    <ul className="flex list-none flex-col gap-0.5">
      {items.map((item) => (
        <NavLink
          href={item.href}
          icon={item.icon}
          isActive={item.isActive}
          key={item.label}
        >
          {item.label}
        </NavLink>
      ))}
    </ul>
  );
}

interface WorkspaceSettingsSidebarProps {
  workspaceSlug: string;
}

export function WorkspaceSettingsSidebar({
  workspaceSlug,
}: WorkspaceSettingsSidebarProps) {
  const { isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const basePath = `/${workspaceSlug}/settings`;

  const isGeneralActive =
    pathname === `${basePath}/general` || pathname === basePath;
  const isMembersActive = pathname === `${basePath}/members`;
  const isDangerZoneActive = pathname === `${basePath}/danger-zone`;

  const settingsNavItems = [
    {
      href: `${basePath}/general`,
      icon: IconSettings,
      label: "General",
      isActive: isGeneralActive,
    },
    {
      href: `${basePath}/members`,
      icon: IconUsers,
      label: "Members",
      isActive: isMembersActive,
    },
    {
      href: `${basePath}/danger-zone`,
      icon: IconAlertTriangle,
      label: "Danger Zone",
      isActive: isDangerZoneActive,
    },
  ];

  return (
    <aside
      className={`flex h-screen w-64 flex-col bg-card ${
        isPending ? "pointer-events-none cursor-not-allowed" : ""
      }`}
    >
      <div className="flex flex-col gap-4 p-4">
        <Button
          className="w-full cursor-pointer items-center justify-start gap-2 px-2"
          onClick={() => router.push(`/${workspaceSlug}`)}
          size={"sm"}
          variant="ghost"
        >
          <IconChevronLeft /> Go back
        </Button>
        <NavMenu items={settingsNavItems} />
      </div>
    </aside>
  );
}
