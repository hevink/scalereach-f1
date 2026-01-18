"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceTracker } from "@/components/workspace/workspace-tracker";

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ "workspace-slug": string }>;
}

export default function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
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
      <WorkspaceTracker slug={slug} />
      <WorkspaceSidebar currentSlug={slug} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
