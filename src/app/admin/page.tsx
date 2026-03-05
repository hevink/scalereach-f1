"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    IconUsers, IconBuildingCommunity, IconVideo,
    IconScissors, IconDownload, IconTrendingUp,
    IconTrendingDown, IconCalendar, IconAlertTriangle,
    IconActivity, IconClock,
} from "@tabler/icons-react";
import { useAdminStats, useSystemHealth } from "@/hooks/useAdmin";
import { AdminOverviewCharts } from "@/components/admin/admin-overview-charts";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";

function StatCard({ title, value, icon: Icon, trend, isLoading, accent }: {
    title: string;
    value: number | string;
    icon: React.ElementType;
    trend?: { value: number; label: string; direction?: "up" | "down" };
    isLoading?: boolean;
    accent?: "green" | "red" | "yellow" | "blue";
}) {
    const accentMap = {
        green: "text-emerald-600",
        red: "text-red-600",
        yellow: "text-amber-600",
        blue: "text-blue-600",
    };
    const trendColor = trend?.direction === "down" ? "text-red-600" : "text-emerald-600";
    const TrendIcon = trend?.direction === "down" ? IconTrendingDown : IconTrendingUp;

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <div className={`p-1.5 rounded-md bg-muted ${accent ? accentMap[accent] : "text-muted-foreground"}`}>
                    <Icon className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <>
                        <div className={`text-2xl font-bold tabular-nums ${accent ? accentMap[accent] : ""}`}>
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </div>
                        {trend && trend.value !== 0 && (
                            <div className={`flex items-center gap-1 text-xs mt-1 ${trendColor}`}>
                                <TrendIcon className="h-3 w-3" />
                                <span>{trend.direction !== "down" ? "+" : ""}{trend.value} {trend.label}</span>
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    );
}

function SystemHealthCard({ isLoading }: { isLoading?: boolean }) {
    const { data: health } = useSystemHealth();

    if (isLoading || !health) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <IconActivity className="h-4 w-4" /> System Health
                    </CardTitle>
                </CardHeader>
                <CardContent><Skeleton className="h-20 w-full" /></CardContent>
            </Card>
        );
    }

    const errorRate = health.errorRate || 0;
    const queueWaiting = health.queueStats?.videoQueue?.waiting || 0;
    const isHealthy = errorRate < 5 && queueWaiting < 10;

    return (
        <Card className={`hover:shadow-md transition-shadow border-l-4 ${isHealthy ? "border-l-emerald-500" : "border-l-red-500"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">System Health</CardTitle>
                <div className={`p-1.5 rounded-md bg-muted ${isHealthy ? "text-emerald-600" : "text-red-600"}`}>
                    <IconActivity className="h-4 w-4" />
                </div>
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${isHealthy ? "text-emerald-600" : "text-red-600"}`}>
                    {isHealthy ? "Healthy" : "Issues"}
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant={errorRate > 10 ? "destructive" : "secondary"} className="text-xs">
                        {errorRate.toFixed(1)}% errors
                    </Badge>
                    <Badge variant={queueWaiting > 20 ? "destructive" : "secondary"} className="text-xs">
                        {queueWaiting} queued
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminOverviewPage() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: subDays(new Date(), 30),
        to: new Date(),
    });
    const { data: stats, isLoading } = useAdminStats();
    const days = dateRange?.from && dateRange?.to
        ? Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24))
        : 30;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">Overview</h1>
                    <p className="text-sm text-muted-foreground">Platform analytics and metrics</p>
                </div>
                <Popover>
                    <PopoverTrigger>
                        <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto justify-start sm:justify-center">
                            <IconCalendar className="h-4 w-4 shrink-0" />
                            <span className="truncate">
                                {dateRange?.from && dateRange?.to
                                    ? `${format(dateRange.from, "LLL dd")} – ${format(dateRange.to, "LLL dd, y")}`
                                    : "Pick a date range"}
                            </span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <div className="flex flex-col sm:flex-row">
                            <div className="border-b sm:border-b-0 sm:border-r p-2 space-y-1">
                                {[{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }].map((p) => (
                                    <Button key={p.days} variant="ghost" size="sm" className="w-full justify-start"
                                        onClick={() => setDateRange({ from: subDays(new Date(), p.days), to: new Date() })}>
                                        {p.label}
                                    </Button>
                                ))}
                            </div>
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from}
                                selected={dateRange} onSelect={setDateRange} numberOfMonths={1} className="sm:[&_table]:w-auto" />
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            {/* Primary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={IconUsers}
                    trend={stats ? { value: stats.newUsersThisWeek, label: "this week" } : undefined}
                    isLoading={isLoading} accent="blue" />
                <StatCard title="Workspaces" value={stats?.totalWorkspaces ?? 0} icon={IconBuildingCommunity} isLoading={isLoading} />
                <StatCard title="Videos" value={stats?.totalVideos ?? 0} icon={IconVideo} isLoading={isLoading} />
                <StatCard title="Clips" value={stats?.totalClips ?? 0} icon={IconScissors} isLoading={isLoading} accent="green" />
                <StatCard title="Exports" value={stats?.totalExports ?? 0} icon={IconDownload} isLoading={isLoading} />
                <SystemHealthCard isLoading={isLoading} />
            </div>

            {/* Charts */}
            <AdminOverviewCharts days={days} />
        </div>
    );
}
