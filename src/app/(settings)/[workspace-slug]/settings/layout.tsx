"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceSettingsSidebar } from "@/components/workspace/workspace-settings-sidebar";

interface WorkspaceSettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "workspace-slug": string }>;
}

export default function WorkspaceSettingsLayout({
  children,
  params,
}: WorkspaceSettingsLayoutProps) {
  const { "workspace-slug": slug } = use(params);
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const { data: workspace, isLoading: workspaceLoading, error } = useWorkspaceBySlug(slug);

  useEffect(() => {
    if (sessionPending || workspaceLoading) return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    if (error || !workspace) {
      router.replace("/");
      return;
    }
  }, [session, workspace, error, sessionPending, workspaceLoading, router]);

  if (sessionPending || workspaceLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!workspace) {
    return null;
  }

  return (
    <SidebarProvider>
      <WorkspaceSettingsSidebar workspaceSlug={slug} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Button
            aria-label="Go to workspace"
            className="h-fit w-fit p-0"
            size="sm"
            variant="outline"
          >
            <Link
              className="flex h-8 items-center justify-center px-3.5"
              href={`/${slug}`}
            >
              <span className="font-[490] text-sm">Go to Workspace</span>
            </Link>
          </Button>
        </header>
        <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
