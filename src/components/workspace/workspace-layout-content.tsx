"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useSession } from "@/lib/auth-client";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceTracker } from "@/components/workspace/workspace-tracker";
import { WorkspaceShortcutsProvider } from "@/components/workspace/workspace-shortcuts-provider";
import { PlanBadge } from "@/components/workspace/plan-badge";

interface WorkspaceLayoutContentProps {
    children: React.ReactNode;
    slug: string;
}

export function WorkspaceLayoutContent({
    children,
    slug,
}: WorkspaceLayoutContentProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: session, isPending: sessionPending } = useSession();
    const { data: workspace, isLoading: workspaceLoading, error } = useWorkspaceBySlug(slug);
    const { theme, setTheme } = useTheme();

    useKeyboardShortcuts([
        {
            key: "d",
            handler: () => setTheme(theme === "dark" ? "light" : "dark"),
        },
    ]);

    useEffect(() => {
        if (sessionPending || workspaceLoading) return;

        if (!session?.user) {
            router.replace("/login");
            return;
        }

        if (error || !workspace) {
            router.replace("/workspaces");
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

    // Hide sidebar on clip editor page
    const isClipEditor = /\/clips\/[^/]+$/.test(pathname);

    if (isClipEditor) {
        return (
            <WorkspaceShortcutsProvider workspaceSlug={slug} workspaceId={workspace.id}>
                <WorkspaceTracker slug={slug} />
                {children}
            </WorkspaceShortcutsProvider>
        );
    }

    return (
        <WorkspaceShortcutsProvider workspaceSlug={slug} workspaceId={workspace.id}>
            <SidebarProvider>
                <WorkspaceTracker slug={slug} />
                <WorkspaceSidebar currentSlug={slug} />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger />
                        <div className="ml-auto">
                            <PlanBadge
                                plan={workspace.plan as "free" | "starter" | "pro"}
                                workspaceSlug={slug}
                            />
                        </div>
                    </header>
                    <main className="flex-1">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </WorkspaceShortcutsProvider>
    );
}
