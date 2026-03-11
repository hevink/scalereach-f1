"use client";

import React, { useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Spinner } from "@/components/ui/spinner";
import { WorkspaceSidebar } from "@/components/workspace/workspace-sidebar";
import { WorkspaceTracker } from "@/components/workspace/workspace-tracker";
import { WorkspaceShortcutsProvider } from "@/components/workspace/workspace-shortcuts-provider";
import { PlanBadge } from "@/components/workspace/plan-badge";
import Link from "next/link";

interface BreadcrumbEntry {
    label: string;
    href?: string; // if undefined, it's the current (non-clickable) page
}

function useBreadcrumbs(pathname: string): BreadcrumbEntry[] {
    const segments = pathname.split("/").filter(Boolean);
    const slug = segments[0]; // workspace slug
    const base = `/${slug}`;

    if (segments.length <= 1) {
        return [
            { label: "Dashboard", href: base },
            { label: "Videos" },
        ];
    }

    const page = segments[1];

    switch (page) {
        case "clips":
            if (segments[2]) {
                return [
                    { label: "Dashboard", href: base },
                    { label: "All Clips", href: `${base}/clips` },
                    { label: "Editor" },
                ];
            }
            return [
                { label: "Dashboard", href: base },
                { label: "All Clips" },
            ];
        case "credits":
            return [
                { label: "Dashboard", href: base },
                { label: "Minute Usage" },
            ];
        case "social":
            return [
                { label: "Dashboard", href: base },
                { label: "Social" },
            ];
        case "pricing":
            return [
                { label: "Dashboard", href: base },
                { label: "Pricing" },
            ];
        case "configure":
            return [
                { label: "Dashboard", href: base },
                { label: "Configure" },
            ];
        case "projects":
            return [
                { label: "Dashboard", href: base },
                { label: "Projects" },
            ];
        case "videos":
            if (segments[3] === "clips") {
                return [
                    { label: "Dashboard", href: base },
                    { label: "Videos", href: base },
                    { label: "Clips" },
                ];
            }
            return [
                { label: "Dashboard", href: base },
                { label: "Videos", href: base },
                { label: "Detail" },
            ];
        default:
            return [
                { label: "Dashboard", href: base },
                { label: page.charAt(0).toUpperCase() + page.slice(1) },
            ];
    }
}

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
                    <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mx-1 h-12! border-muted" />
                        <NavBreadcrumb pathname={pathname} />
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

function NavBreadcrumb({ pathname }: { pathname: string }) {
    const crumbs = useBreadcrumbs(pathname);

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {crumbs.map((crumb, i) => {
                    const isLast = i === crumbs.length - 1;
                    return (
                        <React.Fragment key={crumb.label}>
                            {i > 0 && <BreadcrumbSeparator />}
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={crumb.href!}>{crumb.label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </React.Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
