"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { IconShieldLock, IconArrowLeft, IconHome, IconUsers, IconBuildingCommunity, IconVideo, IconCreditCard } from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAdminStats, useSystemHealth } from "@/hooks/useAdmin";

const navItems = [
    { href: "/admin", label: "Overview", icon: IconHome, exact: true },
    { href: "/admin/users", label: "Users", icon: IconUsers },
    { href: "/admin/workspaces", label: "Workspaces", icon: IconBuildingCommunity },
    { href: "/admin/videos", label: "Videos", icon: IconVideo },
    { href: "/admin/payments", label: "Payments", icon: IconCreditCard },
];

function AdminSidebar() {
    const pathname = usePathname();
    const { data: stats } = useAdminStats();
    const { data: healthData } = useSystemHealth();
    const hasIssues = (healthData?.errorRate || 0) > 10 ||
        ((healthData?.queueStats?.videoQueue?.waiting || 0) > 20);

    return (
        <aside className="w-56 border-r bg-muted/30 min-h-[calc(100vh-3.5rem)] flex flex-col">
            <nav className="p-3 space-y-0.5 flex-1">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link key={item.href} href={item.href}>
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}>
                                <item.icon className="h-4 w-4 shrink-0" />
                                {item.label}
                                {item.href === "/admin" && hasIssues && (
                                    <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-[10px]">!</Badge>
                                )}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            {/* Quick stats */}
            <div className="p-3 border-t">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-1">Quick Stats</p>
                <div className="space-y-1.5 text-xs px-1">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Active Users</span>
                        <span className="font-medium">{stats?.activeUsers ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">New Today</span>
                        <span className="font-medium text-green-600">+{stats?.newUsersToday ?? 0}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">This Week</span>
                        <span className="font-medium text-green-600">+{stats?.newUsersThisWeek ?? 0}</span>
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (isPending) return;
        if (!session) { router.push("/login"); return; }
        if ((session.user as any).role !== "admin") router.push("/workspaces");
    }, [session, isPending, router]);

    if (isPending) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!session || (session.user as any).role !== "admin") {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <IconShieldLock className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-2xl font-semibold">Access Denied</h1>
                <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="flex h-14 items-center gap-4 px-4">
                    <Link href="/workspaces">
                        <Button variant="ghost" size="icon">
                            <IconArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-lg font-semibold">Admin Dashboard</h1>
                </div>
            </header>
            <div className="flex">
                <AdminSidebar />
                <main className="flex-1 p-6 min-w-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
