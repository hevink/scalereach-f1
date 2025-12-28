"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bug,
  ChevronDown,
  ChevronRight,
  Folder,
  HelpCircle,
  Home,
  Inbox,
  MoreHorizontal,
  Settings,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";

function getDicebearUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed)}`;
}

function getRandomSeed(): string {
  return Math.random().toString(36).substring(2, 15);
}

function getUsername(email?: string | null, name?: string | null): string {
  if (email) {
    return email.split("@")[0];
  }
  if (name) {
    return name;
  }
  return "user";
}

interface AnimatedAvatarProps {
  alt?: string;
  className?: string;
  src: string;
}

function AnimatedAvatar({
  alt = "Avatar",
  className = "",
  src,
}: AnimatedAvatarProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <Image
      alt={alt}
      className={`size-full rounded-full object-cover transition-all duration-500 ${
        loaded ? "blur-0" : "blur-md"
      } ${className}`}
      height={32}
      onLoad={() => setLoaded(true)}
      src={src}
      width={32}
    />
  );
}

interface UserAvatarProps {
  alt?: string;
  dicebearUrl: string;
  fallbackUrl: string;
  userImage?: string | null;
}

function UserAvatar({
  alt,
  dicebearUrl,
  fallbackUrl,
  userImage,
}: UserAvatarProps) {
  return (
    <Avatar>
      <AvatarImage alt={alt} src={userImage || dicebearUrl} />
      <AvatarFallback className="overflow-hidden">
        <AnimatedAvatar alt={alt} src={fallbackUrl} />
      </AvatarFallback>
    </Avatar>
  );
}

interface NavLinkProps {
  children: React.ReactNode;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
}

function NavLink({
  children,
  href,
  icon: Icon,
  isActive = false,
}: NavLinkProps) {
  return (
    <li className="list-none">
      <Link
        className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 font-medium text-[13px] transition-colors ${
          isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent"
        }`}
        href={href}
      >
        <Icon className="size-4 shrink-0" />
        <span>{children}</span>
      </Link>
    </li>
  );
}

interface NavMenuProps {
  items: Array<{ href: string; icon: LucideIcon; label: string }>;
  pathname: string;
}

function NavMenu({ items, pathname }: NavMenuProps) {
  return (
    <ul className="flex list-none flex-col gap-0.5">
      {items.map((item, index) => {
        let isActive = false;
        if (item.href === "/" && pathname === "/") {
          isActive = index === 0;
        } else if (item.href !== "/") {
          isActive = pathname === item.href;
        }
        return (
          <NavLink
            href={item.href}
            icon={item.icon}
            isActive={isActive}
            key={item.label}
          >
            {item.label}
          </NavLink>
        );
      })}
    </ul>
  );
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  isOpen: boolean;
}

function CollapsibleContent({ children, isOpen }: CollapsibleContentProps) {
  if (!isOpen) {
    return null;
  }

  return <div className="mt-1 ml-3 flex flex-col gap-0.5 pl-3">{children}</div>;
}

interface CollapsibleGroupProps {
  children: React.ReactNode;
  defaultOpen?: boolean;
  label: string;
}

function CollapsibleGroup({
  children,
  defaultOpen = false,
  label,
}: CollapsibleGroupProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <button
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 font-medium text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span>{label}</span>
        {isOpen ? (
          <ChevronDown className="size-3 shrink-0" />
        ) : (
          <ChevronRight className="size-3 shrink-0" />
        )}
      </button>
      <CollapsibleContent isOpen={isOpen}>{children}</CollapsibleContent>
    </div>
  );
}

interface ProjectItemProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  iconColor: string;
  name: string;
}

function ProjectItem({
  children,
  defaultOpen = false,
  iconColor,
  name,
}: ProjectItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const hasChildren = Boolean(children);

  return (
    <div className="flex flex-col">
      <button
        className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
        onClick={() => hasChildren && setIsOpen(!isOpen)}
        type="button"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="size-5 shrink-0 rounded"
            style={{ backgroundColor: iconColor }}
          />
          <span className="font-medium">{name}</span>
        </div>
        {hasChildren &&
          (isOpen ? (
            <ChevronDown className="size-3 shrink-0" />
          ) : (
            <ChevronRight className="size-3 shrink-0" />
          ))}
      </button>
      {hasChildren && (
        <CollapsibleContent isOpen={isOpen}>{children}</CollapsibleContent>
      )}
    </div>
  );
}

interface LoadingUserProfileProps {
  fallbackUrl: string;
}

function LoadingUserProfile({ fallbackUrl }: LoadingUserProfileProps) {
  return (
    <div className="flex w-full items-center gap-2.5 p-2">
      <Avatar>
        <AvatarFallback className="overflow-hidden">
          <AnimatedAvatar src={fallbackUrl} />
        </AvatarFallback>
      </Avatar>
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
    </div>
  );
}

interface UserProfileProps {
  dicebearUrl: string;
  fallbackUrl: string;
  settingsHref: string;
  user: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  } | null;
  username: string;
}

function UserProfile({
  dicebearUrl,
  fallbackUrl,
  settingsHref,
  user,
  username,
}: UserProfileProps) {
  return (
    <>
      <div className="flex w-full items-center gap-2.5 p-2">
        <UserAvatar
          alt={user?.name || "User avatar"}
          dicebearUrl={dicebearUrl}
          fallbackUrl={fallbackUrl}
          userImage={user?.image}
        />
        <p className="truncate font-medium text-sm">{user?.name || username}</p>
      </div>
      <div className="p-2">
        <Link href={`${settingsHref}/profile`}>
          <Button
            className="cursor-pointer rounded shadow-none hover:bg-card"
            size="icon"
            variant="ghost"
          >
            <Settings className="size-4" />
          </Button>
        </Link>
      </div>
    </>
  );
}

interface SidebarContentProps {
  pathname: string;
  settingsHref: string;
}

function SidebarContent({
  pathname,
  settingsHref: _settingsHref,
}: SidebarContentProps) {
  const mainNavItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/", icon: Inbox, label: "Inbox" },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <NavMenu items={mainNavItems} pathname={pathname} />

      <CollapsibleGroup defaultOpen label="Workspace">
        <NavLink href="/" icon={Folder}>
          Projects
        </NavLink>
        <NavLink href="/" icon={Users}>
          Members
        </NavLink>
        <NavLink href="/" icon={MoreHorizontal}>
          More
        </NavLink>
      </CollapsibleGroup>

      <CollapsibleGroup defaultOpen label="Your Projects">
        <ProjectItem defaultOpen iconColor="#10b981" name="HexaUI">
          <NavLink href="/" icon={Folder}>
            Issues
          </NavLink>
          <NavLink href="/" icon={Folder}>
            Projects
          </NavLink>
        </ProjectItem>
        <ProjectItem iconColor="#ef4444" name="Ikiform">
          <NavLink href="/" icon={Folder}>
            Issues
          </NavLink>
          <NavLink href="/" icon={Folder}>
            Projects
          </NavLink>
        </ProjectItem>
      </CollapsibleGroup>
    </div>
  );
}

interface SidebarFooterProps {
  dicebearUrl: string;
  fallbackUrl: string;
  isPending: boolean;
  pathname: string;
  pendingUrl: string;
  settingsHref: string;
  user: {
    email?: string | null;
    image?: string | null;
    name?: string | null;
  } | null;
  username: string;
}

function SidebarFooter({
  dicebearUrl,
  fallbackUrl,
  isPending,
  pathname,
  pendingUrl,
  settingsHref,
  user,
  username,
}: SidebarFooterProps) {
  const bottomNavItems = [
    { href: "/", icon: Settings, label: "Settings" },
    { href: "/", icon: HelpCircle, label: "Get Help" },
    { href: "/", icon: Bug, label: "Report Bug" },
  ];

  const renderUserProfile = () => {
    if (isPending) {
      if (pendingUrl) {
        return <LoadingUserProfile fallbackUrl={pendingUrl} />;
      }
      return (
        <div className="flex w-full items-center gap-2.5 p-2">
          <Avatar>
            <AvatarFallback className="animate-pulse">...</AvatarFallback>
          </Avatar>
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        </div>
      );
    }

    if (fallbackUrl) {
      return (
        <UserProfile
          dicebearUrl={dicebearUrl}
          fallbackUrl={fallbackUrl}
          settingsHref={settingsHref}
          user={user || null}
          username={username}
        />
      );
    }

    return (
      <div className="flex w-full items-center gap-2.5 p-2">
        <Avatar>
          <AvatarFallback className="animate-pulse">...</AvatarFallback>
        </Avatar>
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <NavMenu items={bottomNavItems} pathname={pathname} />
      <div className="flex w-full items-center">
        <div className="flex w-full items-center justify-between rounded-lg bg-secondary">
          {renderUserProfile()}
        </div>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const [randomFallbackSeed, setRandomFallbackSeed] = useState<string | null>(
    null
  );
  const [randomPendingSeed, setRandomPendingSeed] = useState<string | null>(
    null
  );

  useEffect(() => {
    setRandomFallbackSeed(getRandomSeed());
    setRandomPendingSeed(getRandomSeed());
  }, []);

  const user = session?.user;
  const username = getUsername(user?.email, user?.name);
  const dicebearUrl = getDicebearUrl(username);
  const randomFallbackUrl = randomFallbackSeed
    ? getDicebearUrl(randomFallbackSeed)
    : "";
  const randomPendingUrl = randomPendingSeed
    ? getDicebearUrl(randomPendingSeed)
    : "";
  const settingsHref = user?.id ? `/${user.id}/settings` : "/";

  return (
    <aside
      className={`flex h-screen w-64 flex-col justify-between bg-card ${
        isPending ? "pointer-events-none cursor-not-allowed" : ""
      }`}
    >
      <SidebarContent pathname={pathname} settingsHref={settingsHref} />
      <SidebarFooter
        dicebearUrl={dicebearUrl}
        fallbackUrl={randomFallbackUrl}
        isPending={isPending}
        pathname={pathname}
        pendingUrl={randomPendingUrl}
        settingsHref={settingsHref}
        user={user || null}
        username={username}
      />
    </aside>
  );
}
