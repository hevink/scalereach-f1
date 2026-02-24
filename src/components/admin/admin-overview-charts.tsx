"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from "@/components/ui/chart";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
} from "recharts";
import {
    useUserGrowth,
    useVideoProcessingStats,
    useWorkspacePlanDistribution,
    useDailyActivity,
    useTopWorkspaces,
    useSystemHealth,
    useCreditAnalytics,
} from "@/hooks/useAdmin";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    IconActivity,
    IconAlertTriangle,
    IconCheck,
    IconClock,
    IconCoin,
    IconLoader,
    IconCpu,
    IconVideo,
} from "@tabler/icons-react";

const userGrowthConfig: ChartConfig = {
    users: {
        label: "New Users",
        color: "oklch(0.488 0.243 264.376)",
    },
};

const activityConfig: ChartConfig = {
    videos: {
        label: "Videos",
        color: "oklch(0.488 0.243 264.376)",
    },
    clips: {
        label: "Clips",
        color: "oklch(0.696 0.17 162.48)",
    },
    exports: {
        label: "Exports",
        color: "oklch(0.769 0.188 70.08)",
    },
};

const videoStatusConfig: ChartConfig = {
    pending: {
        label: "Pending",
        color: "oklch(0.769 0.188 70.08)",
    },
    processing: {
        label: "Processing",
        color: "oklch(0.696 0.17 162.48)",
    },
    completed: {
        label: "Completed",
        color: "oklch(0.488 0.243 264.376)",
    },
    failed: {
        label: "Failed",
        color: "oklch(0.645 0.246 16.439)",
    },
};

const planColors: Record<string, string> = {
    free: "oklch(0.769 0.188 70.08)",
    starter: "oklch(0.696 0.17 162.48)",
    pro: "oklch(0.488 0.243 264.376)",
    "pro-plus": "oklch(0.627 0.265 303.9)",
};

function UserGrowthChart({ days }: { days: number }) {
    const { data, isLoading } = useUserGrowth(days);

    if (isLoading) {
        return <Skeleton className="h-[350px] w-full" />;
    }

    const chartData = data?.map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        users: d.users,
    })) || [];

    return (
        <ChartContainer config={userGrowthConfig} className="h-[350px] w-full">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                    type="monotone"
                    dataKey="users"
                    stroke="var(--color-users)"
                    fill="var(--color-users)"
                    fillOpacity={0.3}
                />
            </AreaChart>
        </ChartContainer>
    );
}

function DailyActivityChart({ days }: { days: number }) {
    const { data, isLoading } = useDailyActivity(days);

    if (isLoading) {
        return <Skeleton className="h-[350px] w-full" />;
    }

    const chartData = data?.map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        videos: d.videos,
        clips: d.clips,
        exports: d.exports,
    })) || [];

    return (
        <ChartContainer config={activityConfig} className="h-[350px] w-full">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="videos" fill="var(--color-videos)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clips" fill="var(--color-clips)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exports" fill="var(--color-exports)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartContainer>
    );
}

function VideoProcessingChart() {
    const { data, isLoading } = useVideoProcessingStats();

    if (isLoading) {
        return <Skeleton className="h-[280px] w-full" />;
    }

    const chartData = [
        { name: "Pending", value: data?.pending || 0, fill: "var(--color-pending)" },
        { name: "Processing", value: data?.processing || 0, fill: "var(--color-processing)" },
        { name: "Completed", value: data?.completed || 0, fill: "var(--color-completed)" },
        { name: "Failed", value: data?.failed || 0, fill: "var(--color-failed)" },
    ].filter((d) => d.value > 0);

    const total = chartData.reduce((sum, d) => sum + d.value, 0);

    return (
        <ChartContainer config={videoStatusConfig} className="h-[280px] w-full">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                />
            </PieChart>
        </ChartContainer>
    );
}

function WorkspacePlanChart() {
    const { data, isLoading } = useWorkspacePlanDistribution();

    if (isLoading) {
        return <Skeleton className="h-[280px] w-full" />;
    }

    const chartData = data?.map((d) => ({
        name: d.plan.charAt(0).toUpperCase() + d.plan.slice(1),
        value: d.count,
        fill: planColors[d.plan] || "hsl(var(--chart-5))",
    })) || [];

    return (
        <ChartContainer config={{}} className="h-[280px] w-full">
            <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
            </PieChart>
        </ChartContainer>
    );
}

function TopWorkspacesTable() {
    const { data, isLoading } = useTopWorkspaces(5);

    if (isLoading) {
        return <Skeleton className="h-[280px] w-full" />;
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Workspace</TableHead>
                    <TableHead className="text-right">Videos</TableHead>
                    <TableHead className="text-right">Clips</TableHead>
                    <TableHead className="text-right">Members</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data?.map((workspace) => (
                    <TableRow key={workspace.id}>
                        <TableCell>
                            <div>
                                <div className="font-medium">{workspace.name}</div>
                                <div className="text-xs text-muted-foreground">{workspace.slug}</div>
                            </div>
                        </TableCell>
                        <TableCell className="text-right">{workspace.videoCount}</TableCell>
                        <TableCell className="text-right">{workspace.clipCount}</TableCell>
                        <TableCell className="text-right">{workspace.memberCount}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

function SystemHealthPanel() {
    const { data, isLoading } = useSystemHealth();

    if (isLoading) {
        return <Skeleton className="h-[200px] w-full" />;
    }

    const videoQueue = data?.queueStats?.videoQueue;
    const totalInQueue = (videoQueue?.waiting || 0) + (videoQueue?.active || 0);

    return (
        <div className="space-y-4">
            {/* Queue Status */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Video Queue</span>
                    <span className="font-medium">{totalInQueue} pending</span>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="gap-1">
                        <IconClock className="h-3 w-3" />
                        {videoQueue?.waiting || 0} waiting
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                        <IconLoader className="h-3 w-3 animate-spin" />
                        {videoQueue?.active || 0} active
                    </Badge>
                </div>
            </div>

            {/* Processing Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Avg Transcription</div>
                    <div className="text-lg font-semibold">
                        {Math.round((data?.processingTimes?.avgTranscriptionTime || 0) / 60)}m
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Avg Clip Gen</div>
                    <div className="text-lg font-semibold">
                        {Math.round((data?.processingTimes?.avgClipGenerationTime || 0) / 60)}m
                    </div>
                </div>
            </div>

            {/* Error Rate */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Error Rate</span>
                    <span className={`font-medium ${(data?.errorRate || 0) > 5 ? "text-destructive" : "text-green-600"}`}>
                        {data?.errorRate?.toFixed(1) || 0}%
                    </span>
                </div>
                <Progress
                    value={Math.min(data?.errorRate || 0, 100)}
                    className={`h-2 ${(data?.errorRate || 0) > 5 ? "[&>div]:bg-destructive" : "[&>div]:bg-green-600"}`}
                />
            </div>

            {/* Uptime */}
            <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">System Uptime</span>
                <Badge variant="outline" className="gap-1 text-green-600">
                    <IconCheck className="h-3 w-3" />
                    {data?.uptime || 99.9}%
                </Badge>
            </div>
        </div>
    );
}

function CreditUsageChart({ days }: { days: number }) {
    const { data, isLoading } = useCreditAnalytics(days);

    if (isLoading) {
        return <Skeleton className="h-[280px] w-full" />;
    }

    const chartData = data?.creditsByDay?.map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        used: d.used,
        added: d.added,
    })) || [];

    const creditConfig: ChartConfig = {
        used: {
            label: "Used",
            color: "oklch(0.645 0.246 16.439)",
        },
        added: {
            label: "Added",
            color: "oklch(0.696 0.17 162.48)",
        },
    };

    return (
        <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Total Used ({days}d)</div>
                    <div className="text-lg font-semibold text-orange-600">
                        {data?.totalCreditsUsed?.toLocaleString() || 0}
                    </div>
                </div>
                <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Total Added ({days}d)</div>
                    <div className="text-lg font-semibold text-green-600">
                        {data?.totalCreditsAdded?.toLocaleString() || 0}
                    </div>
                </div>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
                <ChartContainer config={creditConfig} className="h-[200px] w-full">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                            type="monotone"
                            dataKey="used"
                            stroke="var(--color-used)"
                            fill="var(--color-used)"
                            fillOpacity={0.3}
                        />
                        <Area
                            type="monotone"
                            dataKey="added"
                            stroke="var(--color-added)"
                            fill="var(--color-added)"
                            fillOpacity={0.3}
                        />
                    </AreaChart>
                </ChartContainer>
            )}
        </div>
    );
}

const ENCODING_ROWS = [
    { res: "720p", pixels: "1x", cpu: 20, color: "bg-green-500", encode: "15-25s", label: "Low" },
    { res: "1080p", pixels: "2x", cpu: 45, color: "bg-yellow-500", encode: "35-60s", label: "Medium" },
    { res: "1440p", pixels: "4x", cpu: 70, color: "bg-orange-500", encode: "70-100s", label: "High" },
    { res: "4K", pixels: "8x", cpu: 95, color: "bg-red-500", encode: "150-250s", label: "Max" },
];

function EncodingImpactCard() {
    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <IconCpu className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <CardTitle>Encoding CPU Impact</CardTitle>
                        <CardDescription>Per resolution on t3.large · veryfast preset · 1 min clip</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {ENCODING_ROWS.map((row) => (
                    <div key={row.res} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span className="font-medium w-12">{row.res}</span>
                                <Badge variant="outline" className="text-xs h-5">{row.pixels} pixels</Badge>
                                <Badge variant="outline" className="text-xs h-5">{row.encode}</Badge>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-medium ${row.label === "Low" ? "text-green-600" :
                                    row.label === "Medium" ? "text-yellow-600" :
                                        row.label === "High" ? "text-orange-600" : "text-red-600"
                                    }`}>{row.label}</span>
                                <span className="text-xs text-muted-foreground w-8 text-right">{row.cpu}%</span>
                            </div>
                        </div>
                        <Progress value={row.cpu} className={`h-1.5 [&>div]:${row.color}`} />
                    </div>
                ))}
                <p className="text-xs text-muted-foreground pt-1 border-t">
                    2 concurrent 4K jobs = both vCPUs at 100% · queue backs up fast
                </p>
            </CardContent>
        </Card>
    );
}

export function AdminOverviewCharts({ days = 30 }: { days?: number }) {
    return (
        <div className="grid gap-6">
            {/* User Growth & Daily Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>User Growth</CardTitle>
                        <CardDescription>New user registrations over the last {days} days</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UserGrowthChart days={days} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Daily Activity</CardTitle>
                        <CardDescription>Videos, clips, and exports per day</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DailyActivityChart days={days} />
                    </CardContent>
                </Card>
            </div>

            {/* Video Processing, Workspace Plans, Top Workspaces */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Video Processing</CardTitle>
                        <CardDescription>Current video status distribution</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <VideoProcessingChart />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Workspace Plans</CardTitle>
                        <CardDescription>Distribution by subscription tier</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <WorkspacePlanChart />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Top Workspaces</CardTitle>
                        <CardDescription>Most active workspaces by content</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <TopWorkspacesTable />
                    </CardContent>
                </Card>
            </div>

            {/* System Health, Credit Analytics & Encoding Impact */}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <IconActivity className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <CardTitle>System Health</CardTitle>
                                <CardDescription>Queue status and processing metrics</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <SystemHealthPanel />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <IconCoin className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <CardTitle>Credit Usage</CardTitle>
                                <CardDescription>Credit consumption over the last {days} days</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CreditUsageChart days={days} />
                    </CardContent>
                </Card>

                <EncodingImpactCard />
            </div>
        </div>
    );
}
