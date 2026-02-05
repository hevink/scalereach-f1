"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    IconUsers,
    IconBuildingCommunity,
    IconVideo,
    IconScissors,
    IconDownload,
    IconActivity,
    IconTrendingUp,
    IconTrendingDown,
    IconCalendar,
    IconChartBar,
    IconCreditCard,
    IconSettings,
    IconHome,
    IconAlertCircle,
} from "@tabler/icons-react";
import Link from "next/link";
import { useAdminStats, useSystemHealth } from "@/hooks/useAdmin";
import { AdminOverviewCharts } from "@/components/admin/admin-overview-charts";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import { AdminWorkspacesTable } from "@/components/admin/admin-workspaces-table";
import { AdminPaymentsTable } from "@/components/admin/admin-payments-table";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

type AdminView = "overview" | "users" | "workspaces" | "payments";

const navItems = [
    { id: "overview" as const, label: "Overview", icon: IconHome },
    { id: "users" as const, label: "Users", icon: IconUsers },
    { id: "workspaces" as const, label: "Workspaces", icon: IconBuildingCommunity },
    { id: "payments" as const, label: "Payments", icon: IconCreditCard },
];

function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    isLoading,
}: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    trend?: { value: number; label: string; direction?: "up" | "down" };
    isLoading?: boolean;
}) {
    const trendColor = trend?.direction === "down" ? "text-red-600" : "text-green-600";
    const TrendIcon = trend?.direction === "down" ? IconTrendingDown : IconTrendingUp;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                ) : (
                    <>
                        <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
                        {trend && trend.value !== 0 && (
                            <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
                                <TrendIcon className="h-3 w-3" />
                                <span>{trend.direction === "down" ? "" : "+"}{trend.value} {trend.label}</span>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function DateRangePicker({
    dateRange,
    onDateRangeChange,
}: {
    dateRange: DateRange | undefined;
    onDateRangeChange: (range: DateRange | undefined) => void;
}) {
    const presets = [
        { label: "Last 7 days", days: 7 },
        { label: "Last 30 days", days: 30 },
        { label: "Last 90 days", days: 90 },
    ];

    return (
        <Popover>
            <PopoverTrigger className="inline-flex items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal hover:bg-accent hover:text-accent-foreground">
                <IconCalendar className="h-4 w-4" />
                {dateRange?.from ? (
                    dateRange.to ? (
                        <>
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                    ) : (
                        format(dateRange.from, "LLL dd, y")
                    )
                ) : (
                    <span>Pick a date range</span>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <div className="flex">
                    <div className="border-r p-2 space-y-1">
                        {presets.map((preset) => (
                            <Button
                                key={preset.days}
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => onDateRangeChange({
                                    from: subDays(new Date(), preset.days),
                                    to: new Date(),
                                })}
                            >
                                {preset.label}
                            </Button>
                        ))}
                    </div>
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={onDateRangeChange}
                        numberOfMonths={2}
                    />
                </div>
            </PopoverContent>
        </Popover>
    );
}

function AdminSidebar({
    activeView,
    onViewChange,
}: {
    activeView: AdminView;
    onViewChange: (view: AdminView) => void;
}) {
    const { data: healthData } = useSystemHealth();
    // Only show alert for high error rates (>10%) or many items stuck in queue (>20)
    const hasIssues = (healthData?.errorRate || 0) > 10 ||
        ((healthData?.queueStats?.videoQueue?.waiting || 0) > 20);

    return (
        <aside className="w-64 border-r bg-muted/30 min-h-[calc(100vh-3.5rem)]">
            <div className="p-4 space-y-1">
                <div className="px-3 py-2">
                    <h2 className="text-lg font-semibold">Admin</h2>
                    <p className="text-xs text-muted-foreground">Manage your platform</p>
                </div>
                <nav className="space-y-1 mt-4">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors",
                                activeView === item.id
                                    ? "bg-primary text-primary-foreground"
                                    : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                            {item.id === "overview" && hasIssues && (
                                <Badge variant="destructive" className="ml-auto h-5 w-5 p-0 flex items-center justify-center">
                                    !
                                </Badge>
                            )}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Quick Stats in Sidebar */}
            <div className="p-4 border-t mt-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-3">Quick Stats</h3>
                <QuickStatsSidebar />
            </div>
        </aside>
    );
}

function QuickStatsSidebar() {
    const { data: stats, isLoading } = useAdminStats();

    if (isLoading) {
        return <Skeleton className="h-20 w-full" />;
    }

    return (
        <div className="space-y-2 text-sm">
            <div className="flex justify-between">
                <span className="text-muted-foreground">Active Users</span>
                <span className="font-medium">{stats?.activeUsers || 0}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">New Today</span>
                <span className="font-medium text-green-600">+{stats?.newUsersToday || 0}</span>
            </div>
            <div className="flex justify-between">
                <span className="text-muted-foreground">This Week</span>
                <span className="font-medium text-green-600">+{stats?.newUsersThisWeek || 0}</span>
            </div>
        </div>
    );
}

function OverviewContent({ dateRange }: { dateRange: DateRange | undefined }) {
    const { data: stats, isLoading: statsLoading } = useAdminStats();
    const days = dateRange?.from && dateRange?.to
        ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 30;

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers ?? 0}
                    icon={IconUsers}
                    trend={stats ? { value: stats.newUsersThisWeek, label: "this week" } : undefined}
                    isLoading={statsLoading}
                />
                <StatCard
                    title="Workspaces"
                    value={stats?.totalWorkspaces ?? 0}
                    icon={IconBuildingCommunity}
                    isLoading={statsLoading}
                />
                <StatCard
                    title="Videos"
                    value={stats?.totalVideos ?? 0}
                    icon={IconVideo}
                    isLoading={statsLoading}
                />
                <StatCard
                    title="Clips Generated"
                    value={stats?.totalClips ?? 0}
                    icon={IconScissors}
                    isLoading={statsLoading}
                />
                <StatCard
                    title="Exports"
                    value={stats?.totalExports ?? 0}
                    icon={IconDownload}
                    isLoading={statsLoading}
                />
            </div>

            {/* Charts */}
            <AdminOverviewCharts days={days} />
        </div>
    );
}

export default function AdminDashboard() {
    const [activeView, setActiveView] = useState<AdminView>("overview");
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });

    const renderContent = () => {
        switch (activeView) {
            case "overview":
                return <OverviewContent dateRange={dateRange} />;
            case "users":
                return <AdminUsersTable />;
            case "workspaces":
                return <AdminWorkspacesTable />;
            case "payments":
                return <AdminPaymentsTable dateRange={dateRange} />;
            default:
                return <OverviewContent dateRange={dateRange} />;
        }
    };

    const getPageTitle = () => {
        switch (activeView) {
            case "overview": return "Overview";
            case "users": return "Users";
            case "workspaces": return "Workspaces";
            case "payments": return "Payments & Credits";
            default: return "Overview";
        }
    };

    return (
        <div className="flex">
            <AdminSidebar activeView={activeView} onViewChange={setActiveView} />

            <main className="flex-1 p-6">
                {/* Page Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
                        <p className="text-sm text-muted-foreground">
                            {activeView === "overview" && "Platform analytics and metrics"}
                            {activeView === "users" && "Manage all users on the platform"}
                            {activeView === "workspaces" && "View and manage workspaces"}
                            {activeView === "payments" && "Credit transactions and payment history"}
                        </p>
                    </div>

                    {(activeView === "overview" || activeView === "payments") && (
                        <DateRangePicker
                            dateRange={dateRange}
                            onDateRangeChange={setDateRange}
                        />
                    )}
                </div>

                {renderContent()}
            </main>
        </div>
    );
}
