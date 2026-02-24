"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    IconUsers, IconBuildingCommunity, IconVideo,
    IconScissors, IconDownload, IconTrendingUp,
    IconTrendingDown, IconCalendar,
} from "@tabler/icons-react";
import { useAdminStats } from "@/hooks/useAdmin";
import { AdminOverviewCharts } from "@/components/admin/admin-overview-charts";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";

function StatCard({ title, value, icon: Icon, trend, isLoading }: {
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
                {isLoading ? <Skeleton className="h-8 w-24" /> : (
                    <>
                        <div className="text-2xl font-bold">{typeof value === "number" ? value.toLocaleString() : value}</div>
                        {trend && trend.value !== 0 && (
                            <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Overview</h1>
                    <p className="text-sm text-muted-foreground">Platform analytics and metrics</p>
                </div>
                <Popover>
                    <PopoverTrigger className="inline-flex items-center justify-start gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal hover:bg-accent hover:text-accent-foreground">
                        <IconCalendar className="h-4 w-4" />
                        {dateRange?.from && dateRange?.to
                            ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`
                            : "Pick a date range"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                        <div className="flex">
                            <div className="border-r p-2 space-y-1">
                                {[{ label: "Last 7 days", days: 7 }, { label: "Last 30 days", days: 30 }, { label: "Last 90 days", days: 90 }].map((p) => (
                                    <Button key={p.days} variant="ghost" size="sm" className="w-full justify-start"
                                        onClick={() => setDateRange({ from: subDays(new Date(), p.days), to: new Date() })}>
                                        {p.label}
                                    </Button>
                                ))}
                            </div>
                            <Calendar initialFocus mode="range" defaultMonth={dateRange?.from}
                                selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <StatCard title="Total Users" value={stats?.totalUsers ?? 0} icon={IconUsers}
                    trend={stats ? { value: stats.newUsersThisWeek, label: "this week" } : undefined} isLoading={isLoading} />
                <StatCard title="Workspaces" value={stats?.totalWorkspaces ?? 0} icon={IconBuildingCommunity} isLoading={isLoading} />
                <StatCard title="Videos" value={stats?.totalVideos ?? 0} icon={IconVideo} isLoading={isLoading} />
                <StatCard title="Clips Generated" value={stats?.totalClips ?? 0} icon={IconScissors} isLoading={isLoading} />
                <StatCard title="Exports" value={stats?.totalExports ?? 0} icon={IconDownload} isLoading={isLoading} />
            </div>

            <AdminOverviewCharts days={days} />
        </div>
    );
}
