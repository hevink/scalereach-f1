"use client";

import { useSession } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import {
    IconShieldLock, IconArrowLeft, IconHome, IconUsers,
    IconBuildingCommunity, IconVideo, IconCreditCard, IconMenu2, IconX,
    IconAlertTriangle, IconBrandYoutube, IconServer, IconTerminal2, IconGift,
    IconBolt,
} from "@tabler/icons-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAdminStats, useSystemHealth, useFailedItems } from "@/hooks/useAdmin";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
    { href: "/admin", label: "Overview", icon: IconHome, exact: true },
    { href: "/admin/users", label: "Users", icon: IconUsers },
    { href: "/admin/workspaces", label: "Workspaces", icon: IconBuildingCommunity },
    { href: "/admin/videos", label: "Videos", icon: IconVideo },
    { href: "/admin/failed", label: "Failed", icon: IconAlertTriangle },
    { href: "/admin/payments", label: "Payments", icon: IconCreditCard },
    { href: "/admin/affiliate", label: "Affiliate", icon: IconGift },
    { href: "/admin/youtube", label: "YouTube", icon: IconBrandYoutube },
    { href: "/admin/worker", label: "Worker", icon: IconServer },
    { href: "/admin/burst-logs", label: "Burst Logs", icon: IconBolt },
    { href: "/admin/logs", label: "Logs", icon: IconTerminal2 },
];

function NavLinks({ pathname, hasIssues, stats, failedCount, onNavigate }: {
    pathname: string;
    hasIssues: boolean;
    stats: any;
    failedCount?: number;
    onNavigate?: () => void;
}) {
    return (
        <div className="flex flex-col h-full">
            <nav className="p-3 space-y-0.5 flex-1">
                {navItems.map((item) => {
                    const isActive = item.exact
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(item.href + "/");
                    return (
                        <Link key={item.href} href={item.href} onClick={onNavigate}>
                            <div className={cn(
                                "flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground font-medium"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}>
                                <item.icon className={cn("h-4 w-4 shrink-0", item.href === "/admin/failed" && !isActive && "text-red-500")} />
                                {item.label}
                                {item.href === "/admin" && hasIssues && (
                                    <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center text-[10px]">!</Badge>
                                )}
                                {item.href === "/admin/failed" && failedCount ? (
                                    <Badge className="ml-auto bg-red-600 text-white text-[10px] h-5 min-w-5 px-1 flex items-center justify-center">
                                        {failedCount > 99 ? "99+" : failedCount}
                                    </Badge>
                                ) : null}
                            </div>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-3 border-t">
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1 uppercase tracking-wider">Quick Stats</p>
                <div className="space-y-2 text-xs px-1">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Active Users</span>
                        <span className="font-semibold tabular-nums">{stats?.activeUsers ?? "-"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">New Today</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">+{stats?.newUsersToday ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">This Week</span>
                        <span className="font-semibold text-emerald-600 tabular-nums">+{stats?.newUsersThisWeek ?? 0}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { data: session, isPending } = useSession();
    const router = useRouter();
    const pathname = usePathname();
    const { data: stats } = useAdminStats();
    const { data: healthData } = useSystemHealth();
    const { data: failedData } = useFailedItems();
    const [mobileOpen, setMobileOpen] = useState(false);

    const hasIssues = (healthData?.errorRate || 0) > 10 ||
        ((healthData?.queueStats?.videoQueue?.waiting || 0) > 20);
    const failedCount = (failedData?.totalFailedVideos ?? 0) + (failedData?.totalFailedClips ?? 0);

    useEffect(() => {
        if (isPending) return;
        if (!session) { router.push("/login"); return; }
        if ((session.user as any).role !== "admin") router.push("/workspaces");
    }, [session, isPending, router]);

    // Close mobile nav on route change
    useEffect(() => { setMobileOpen(false); }, [pathname]);

    if (isPending) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner className="h-8 w-8" />
            </div>
        );
    }

    if (!session || (session.user as any).role !== "admin") {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4 px-4 text-center">
                <IconShieldLock className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-2xl font-semibold">Access Denied</h1>
                <p className="text-muted-foreground">You need admin privileges to access this page.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
                <div className="flex h-14 items-center gap-3 px-4">
                    {/* Mobile menu trigger */}
                    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                        <SheetTrigger>
                            <Button variant="ghost" size="icon" className="lg:hidden">
                                <IconMenu2 className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-56 p-0">
                            <div className="flex items-center gap-2 h-14 px-4 border-b">
                                <span className="font-semibold text-sm">Admin Dashboard</span>
                            </div>
                            <NavLinks
                                pathname={pathname}
                                hasIssues={hasIssues}
                                stats={stats}
                                failedCount={failedCount}
                                onNavigate={() => setMobileOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>

                    <Link href="/workspaces">
                        <Button variant="ghost" size="icon">
                            <IconArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <h1 className="text-base font-semibold">Admin Dashboard</h1>
                    {hasIssues && (
                        <Badge variant="destructive" className="ml-1 text-xs">Issues</Badge>
                    )}
                </div>
            </header>

            <div className="flex">
                {/* Desktop sidebar */}
                <aside className="hidden lg:flex w-56 border-r bg-muted/20 min-h-[calc(100vh-3.5rem)] flex-col shrink-0">
                    <NavLinks pathname={pathname} hasIssues={hasIssues} stats={stats} failedCount={failedCount} />
                </aside>

                {/* Main content */}
                <main className="flex-1 min-w-0 p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
