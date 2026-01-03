"use client";

import { IconSettings } from "@tabler/icons-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export function UserProfileSkeleton() {
  return (
    <>
      <Skeleton className="size-8 rounded-full" />
      <div className="grid flex-1 gap-1 text-left text-sm leading-tight">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-32" />
      </div>
      <Skeleton className="size-4" />
    </>
  );
}

export function UserProfileSection() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <UserProfileSkeleton />;
  }

  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ||
    user.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Avatar size="sm">
          {user.image && (
            <AvatarImage alt={user.name || "User"} src={user.image} />
          )}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <p className="truncate font-[490] text-sm">{user.name || "User"}</p>
          <p className="truncate text-muted-foreground text-xs">{user.email}</p>
        </div>
      </div>
      <Separator />
      <div className="px-2">
        <Link
          aria-label="Settings"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "w-full justify-start"
          )}
          href="/settings"
        >
          <IconSettings className="size-4" />
          <span className="font-[490] text-sm">Settings</span>
        </Link>
      </div>
    </div>
  );
}
