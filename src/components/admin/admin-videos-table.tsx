"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    IconSearch,
    IconDownload,
    IconChevronLeft,
    IconChevronRight,
    IconVideo,
    IconAlertTriangle,
    IconCheck,
    IconRefresh,
    IconUpload,
    IconBrandYoutube,
    IconLink,
    IconX,
} from "@tabler/icons-react";
import { useAdminVideos, useAdminVideoDetail, useAdminVideoAnalytics, useRetryVideo } from "@/hooks/useAdmin";
import { AdminVideoFilters } from "@/lib/api/admin";
import { formatDistanceToNow, format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { DateRange } from "react-day-picker";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from "recharts";

interface AdminVideosTableProps {
    dateRange: DateRange | undefined;
}

const STATUS_COLORS: Record<string, string> = {
    completed: "bg-green-600",
    failed: "bg-red-600",
    pending: "bg-gray-500",
    pending_config: "bg-gray-500",
    downloading: "bg-yellow-600",
    uploading: "bg-yellow-600",
    transcribing: "bg-yellow-600",
    analyzing: "bg-yellow-600",
};

const PIE_COLORS = ["#22c55e", "#ef4444", "#eab308", "#6b7280", "#3b82f6", "#8b5cf6", "#f97316"];

const PROCESSING_STEPS = ["pending", "downloading", "uploading", "transcribing", "analyzing", "completed"];

function formatDuration(seconds: number | null) {
    if (!seconds) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatBytes(bytes: number | null) {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge className={`${STATUS_COLORS[status] || "bg-gray-500"} text-white`}>
            {status.replace("_", " ")}
        </Badge>
    );
}

function SourceIcon({ type }: { type: string }) {
    if (type === "youtube") return <IconBrandYoutube className="h-4 w-4 text-red-500" />;
    if (type === "upload") return <IconUpload className="h-4 w-4 text-blue-500" />;
    return <IconLink className="h-4 w-4 text-gray-500" />;
}

function VideoDetailDialog({
    videoId,
    open,
    onClose,
}: {
    videoId: string | null;
    open: boolean;
    onClose: () => void;
}) {
    const { data, isLoading } = useAdminVideoDetail(videoId);
    const retryMutation = useRetryVideo();

    const handleRetry = async () => {
        if (!videoId) return;
        try {
            await retryMutation.mutateAsync(videoId);
            toast.success("Video queued for retry");
        } catch {
            toast.error("Failed to retry video");
        }
    };

    const currentStepIndex = data?.video
        ? PROCESSING_STEPS.indexOf(data.video.status === "failed" ? "failed" : data.video.status)
        : -1;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{data?.video?.title || "Video Detail"}</DialogTitle>
                </DialogHeader>

                {isLoading ? (
                    <div className="space-y-4">
                        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                    </div>
                ) : data ? (
                    <div className="space-y-6">
                        {/* Video Info */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Video Info</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={data.video.status} /></div>
                                    <div><span className="text-muted-foreground">Source:</span> <span className="inline-flex items-center gap-1"><SourceIcon type={data.video.sourceType} /> {data.video.sourceType}</span></div>
                                    <div><span className="text-muted-foreground">Duration:</span> {formatDuration(data.video.duration)}</div>
                                    <div><span className="text-muted-foreground">File Size:</span> {formatBytes(data.video.fileSize)}</div>
                                    <div><span className="text-muted-foreground">User:</span> {data.video.userName} ({data.video.userEmail})</div>
                                    <div><span className="text-muted-foreground">Workspace:</span> {data.video.workspaceName || "-"}</div>
                                    <div><span className="text-muted-foreground">Project:</span> {data.video.projectName || "-"}</div>
                                    <div><span className="text-muted-foreground">MIME:</span> {data.video.mimeType || "-"}</div>
                                    <div><span className="text-muted-foreground">Credits Used:</span> {data.video.creditsUsed}</div>
                                    <div><span className="text-muted-foreground">Minutes Consumed:</span> {data.video.minutesConsumed}</div>
                                    <div><span className="text-muted-foreground">Language:</span> {data.video.transcriptLanguage || "-"}</div>
                                    <div><span className="text-muted-foreground">Regenerations:</span> {data.video.regenerationCount}</div>
                                </div>
                                {data.video.sourceUrl && (
                                    <div className="mt-2 text-sm truncate">
                                        <span className="text-muted-foreground">Source URL:</span>{" "}
                                        <span className="text-blue-500">{data.video.sourceUrl}</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Processing Timeline */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Processing Timeline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-1">
                                    {PROCESSING_STEPS.map((step, i) => {
                                        const isCurrent = data.video.status === step;
                                        const isPast = data.video.status === "completed"
                                            ? true
                                            : currentStepIndex > i;
                                        const isFailed = data.video.status === "failed" && i === currentStepIndex;

                                        return (
                                            <div key={step} className="flex items-center gap-1 flex-1">
                                                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-medium shrink-0 ${
                                                    isFailed ? "bg-red-600 text-white" :
                                                    isCurrent ? "bg-yellow-500 text-white animate-pulse" :
                                                    isPast ? "bg-green-600 text-white" :
                                                    "bg-muted text-muted-foreground"
                                                }`}>
                                                    {isFailed ? <IconX className="h-3 w-3" /> :
                                                     isPast ? <IconCheck className="h-3 w-3" /> :
                                                     i + 1}
                                                </div>
                                                {i < PROCESSING_STEPS.length - 1 && (
                                                    <div className={`h-0.5 flex-1 ${isPast ? "bg-green-600" : "bg-muted"}`} />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between mt-1">
                                    {PROCESSING_STEPS.map((step) => (
                                        <span key={step} className="text-[10px] text-muted-foreground capitalize">{step}</span>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Error Card */}
                        {data.video.status === "failed" && data.video.errorMessage && (
                            <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                                        <IconAlertTriangle className="h-4 w-4" /> Error Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <pre className="text-xs text-red-700 dark:text-red-400 whitespace-pre-wrap break-all bg-red-100 dark:bg-red-950/40 p-3 rounded">
                                        {data.video.errorMessage}
                                    </pre>
                                    <Button
                                        size="sm"
                                        className="mt-3"
                                        onClick={handleRetry}
                                        disabled={retryMutation.isPending}
                                    >
                                        <IconRefresh className="h-4 w-4 mr-1" />
                                        {retryMutation.isPending ? "Retrying..." : "Retry Video"}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Config Card */}
                        {data.config && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm">Processing Config</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div><span className="text-muted-foreground">Clip Model:</span> {data.config.clipModel}</div>
                                        <div><span className="text-muted-foreground">Genre:</span> {data.config.genre}</div>
                                        <div><span className="text-muted-foreground">Duration Range:</span> {data.config.clipDurationMin}s - {data.config.clipDurationMax}s</div>
                                        <div><span className="text-muted-foreground">Language:</span> {data.config.language || "Auto"}</div>
                                        <div><span className="text-muted-foreground">Aspect Ratio:</span> {data.config.aspectRatio}</div>
                                        <div><span className="text-muted-foreground">Clip Type:</span> {data.config.clipType}</div>
                                        <div><span className="text-muted-foreground">Captions:</span> {data.config.enableCaptions ? "Yes" : "No"}</div>
                                        <div><span className="text-muted-foreground">Split Screen:</span> {data.config.enableSplitScreen ? `Yes (${data.config.splitRatio}%)` : "No"}</div>
                                        <div><span className="text-muted-foreground">Watermark:</span> {data.config.enableWatermark ? "Yes" : "No"}</div>
                                        <div><span className="text-muted-foreground">Caption Template:</span> {data.config.captionTemplateId}</div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Clips Summary */}
                        <Card>
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm">Clips ({data.clips.total})</CardTitle>
                                    <div className="flex gap-2">
                                        <Badge variant="outline">{data.clips.detected} detected</Badge>
                                        <Badge variant="outline" className="text-yellow-600">{data.clips.generating} generating</Badge>
                                        <Badge variant="outline" className="text-green-600">{data.clips.ready} ready</Badge>
                                        <Badge variant="outline" className="text-red-600">{data.clips.failed} failed</Badge>
                                    </div>
                                </div>
                            </CardHeader>
                            {data.clips.items.length > 0 && (
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Title</TableHead>
                                                <TableHead>Score</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Duration</TableHead>
                                                <TableHead>Time Range</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {data.clips.items.map((clip) => (
                                                <TableRow key={clip.id}>
                                                    <TableCell className="font-medium max-w-[200px] truncate">{clip.title || "-"}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline">{clip.score}</Badge>
                                                    </TableCell>
                                                    <TableCell><StatusBadge status={clip.status} /></TableCell>
                                                    <TableCell>{formatDuration(clip.duration)}</TableCell>
                                                    <TableCell className="text-muted-foreground text-xs">
                                                        {formatDuration(clip.startTime)} - {formatDuration(clip.endTime)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            )}
                        </Card>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">Video not found</div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export function AdminVideosTable({ dateRange }: AdminVideosTableProps) {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

    const days = dateRange?.from && dateRange?.to
        ? Math.max(1, differenceInDays(dateRange.to, dateRange.from))
        : 30;

    const filters: AdminVideoFilters = useMemo(() => ({
        status: statusFilter !== "all" ? statusFilter : undefined,
        sourceType: sourceFilter !== "all" ? sourceFilter : undefined,
        search: searchQuery || undefined,
        dateFrom: dateRange?.from ? dateRange.from.toISOString() : undefined,
        dateTo: dateRange?.to ? dateRange.to.toISOString() : undefined,
    }), [statusFilter, sourceFilter, searchQuery, dateRange]);

    const { data: videos, isLoading } = useAdminVideos(page, 20, filters);
    const { data: analytics } = useAdminVideoAnalytics(days);
    const retryMutation = useRetryVideo();

    const totalVideos = analytics?.statusDistribution.reduce((sum, s) => sum + s.count, 0) || 0;
    const completedCount = analytics?.statusDistribution.find(s => s.status === "completed")?.count || 0;
    const failedCount = analytics?.statusDistribution.find(s => s.status === "failed")?.count || 0;
    const processingCount = totalVideos - completedCount - failedCount;

    const formatProcessingTime = (seconds: number) => {
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    };

    const exportCSV = () => {
        if (!videos?.videos.length) return;
        const csv = [
            ["ID", "Title", "Status", "Source", "Duration", "User", "Workspace", "Clips", "Created"].join(","),
            ...videos.videos.map((v) => [
                v.id,
                `"${(v.title || "").replace(/"/g, '""')}"`,
                v.status,
                v.sourceType,
                v.duration || "",
                `"${(v.userName || "").replace(/"/g, '""')}"`,
                `"${(v.workspaceName || "").replace(/"/g, '""')}"`,
                v.clipCount,
                format(new Date(v.createdAt), "yyyy-MM-dd HH:mm"),
            ].join(","))
        ].join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `videos-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Videos exported successfully");
    };

    const dailyChartConfig: ChartConfig = {
        total: { label: "Total", color: "oklch(0.623 0.214 259.815)" },
        completed: { label: "Completed", color: "oklch(0.696 0.17 162.48)" },
        failed: { label: "Failed", color: "oklch(0.645 0.246 16.439)" },
    };

    const dailyChartData = analytics?.dailyVideos?.map((d) => ({
        date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        total: d.total,
        completed: d.completed,
        failed: d.failed,
    })) || [];

    const statusPieData = analytics?.statusDistribution.map((s, i) => ({
        name: s.status,
        value: s.count,
        fill: PIE_COLORS[i % PIE_COLORS.length],
    })) || [];

    const sourcePieData = analytics?.sourceTypeDistribution.map((s, i) => ({
        name: s.sourceType,
        value: s.count,
        fill: PIE_COLORS[i % PIE_COLORS.length],
    })) || [];

    return (
        <div className="space-y-6">
            {/* Analytics Cards */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Videos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalVideos.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{completedCount.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{failedCount.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{processingCount.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Error Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${(analytics?.errorRate || 0) > 10 ? "text-red-600" : "text-green-600"}`}>
                            {analytics?.errorRate || 0}%
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avg Processing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {formatProcessingTime(analytics?.avgProcessingTime || 0)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Row */}
            <div className="grid gap-4 md:grid-cols-3">
                {dailyChartData.length > 0 && (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Daily Videos</CardTitle>
                            <CardDescription>Video processing over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChartContainer config={dailyChartConfig} className="h-[250px] w-full">
                                <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Area type="monotone" dataKey="total" stroke="var(--color-total)" fill="var(--color-total)" fillOpacity={0.2} />
                                    <Area type="monotone" dataKey="completed" stroke="var(--color-completed)" fill="var(--color-completed)" fillOpacity={0.2} />
                                    <Area type="monotone" dataKey="failed" stroke="var(--color-failed)" fill="var(--color-failed)" fillOpacity={0.2} />
                                </AreaChart>
                            </ChartContainer>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Distribution</CardTitle>
                        <CardDescription>By status & source</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {statusPieData.length > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Status</p>
                                <div className="flex flex-wrap gap-2">
                                    {statusPieData.map((s, i) => (
                                        <div key={i} className="flex items-center gap-1 text-xs">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.fill }} />
                                            {s.name}: {s.value}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {sourcePieData.length > 0 && (
                            <div>
                                <p className="text-xs text-muted-foreground mb-2">Source Type</p>
                                <div className="flex flex-wrap gap-2">
                                    {sourcePieData.map((s, i) => (
                                        <div key={i} className="flex items-center gap-1 text-xs">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: s.fill }} />
                                            {s.name}: {s.value}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Videos Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>All Videos</CardTitle>
                            <CardDescription>{videos?.total || 0} videos total</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={exportCSV}>
                            <IconDownload className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Filters */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        <div className="relative flex-1 min-w-[200px]">
                            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title, user name, or email..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                                className="pl-9"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1); }}>
                            <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="pending_config">Pending Config</SelectItem>
                                <SelectItem value="downloading">Downloading</SelectItem>
                                <SelectItem value="uploading">Uploading</SelectItem>
                                <SelectItem value="transcribing">Transcribing</SelectItem>
                                <SelectItem value="analyzing">Analyzing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v ?? "all"); setPage(1); }}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Source" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                <SelectItem value="youtube">YouTube</SelectItem>
                                <SelectItem value="upload">Upload</SelectItem>
                                <SelectItem value="url">URL</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                        </div>
                    ) : !videos?.videos.length ? (
                        <div className="text-center py-8 text-muted-foreground">No videos found</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Source</TableHead>
                                    <TableHead>Duration</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Workspace</TableHead>
                                    <TableHead>Clips</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {videos.videos.map((v) => (
                                    <TableRow
                                        key={v.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => setSelectedVideoId(v.id)}
                                    >
                                        <TableCell className="font-medium max-w-[200px]">
                                            <div className="flex items-center gap-2">
                                                {v.thumbnailUrl ? (
                                                    <img src={v.thumbnailUrl} alt="" className="h-8 w-12 rounded object-cover shrink-0" />
                                                ) : (
                                                    <div className="h-8 w-12 rounded bg-muted flex items-center justify-center shrink-0">
                                                        <IconVideo className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <span className="truncate">{v.title || "Untitled"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <StatusBadge status={v.status} />
                                                {v.status === "failed" && v.errorMessage && (
                                                    <IconAlertTriangle className="h-3 w-3 text-red-500" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <SourceIcon type={v.sourceType} />
                                                <span className="text-xs">{v.sourceType}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{formatDuration(v.duration)}</TableCell>
                                        <TableCell className="max-w-[120px] truncate text-sm">{v.userName || "-"}</TableCell>
                                        <TableCell className="max-w-[120px] truncate text-sm">{v.workspaceName || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{v.clipCount}</Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs">
                                            {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                                        </TableCell>
                                        <TableCell>
                                            {v.status === "failed" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        retryMutation.mutateAsync(v.id).then(
                                                            () => toast.success("Video queued for retry"),
                                                            () => toast.error("Failed to retry video")
                                                        );
                                                    }}
                                                    disabled={retryMutation.isPending}
                                                >
                                                    <IconRefresh className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}

                    {/* Pagination */}
                    {videos && videos.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <div className="text-sm text-muted-foreground">
                                Page {videos.page} of {videos.totalPages} ({videos.total} total)
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    <IconChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage((p) => Math.min(videos.totalPages, p + 1))}
                                    disabled={page === videos.totalPages}
                                >
                                    Next
                                    <IconChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <VideoDetailDialog
                videoId={selectedVideoId}
                open={!!selectedVideoId}
                onClose={() => setSelectedVideoId(null)}
            />
        </div>
    );
}