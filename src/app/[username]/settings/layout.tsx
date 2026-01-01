"use client";

import { IconHome } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}

export default function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const { username } = use(params);

  useEffect(() => {
    if (!isPending) {
      if (!session?.user) {
        router.replace("/login");
        return;
      }

      if (session.user.username !== username) {
        router.replace("/home");
        return;
      }
    }
  }, [session, isPending, router, username]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!session?.user || session.user.username !== username) {
    return null;
  }

  return (
    <SidebarProvider>
      <SettingsSidebar username={username} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Button
            variant="outline"
            size="sm"
            aria-label="Go to home"
          >
            <Link href="/">
              <span className="text-sm font-[490] text-[13px]">Go Home</span>
            </Link>
          </Button>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6 max-w-xl mx-auto w-full">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
