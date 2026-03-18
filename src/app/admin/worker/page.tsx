"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    IconRefresh, IconServer, IconCpu, IconDatabase,
    IconGitBranch, IconClock, IconActivity, IconPlayerPlay,
    IconPlayerStop, IconCloud, IconBolt, IconLoader2,
    IconFileText, IconDownload,
} from "@tabler/icons-react";
import { useWorkerStatus, useEC2Status, useControlEC2, useBurstWorkerStatus, useScalerState, useForceScalerCheck, useBurstLogs } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import type { EC2Instance } from "@/lib/api/admin";

function formatUptime(seconds: number) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function QueueCard({ name, stats }: { name: string; stats: any }) {
    if (!stats) return null;
    return (
        <div className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{name}</span>
                {stats.active > 0 && (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                        {stats.active} active
                    </Badge>
                )}
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
                <div>
                    <p className="text-muted-foreground">Waiting</p>
                    <p className={cn("font-semibold tabular-nums", stats.waiting > 0 && "text-amber-600")}>{stats.waiting}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Active</p>
                    <p className={cn("font-semibold tabular-nums", stats.active > 0 && "text-blue-600")}>{stats.active}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Done</p>
                    <p className="font-semibold tabular-nums text-emerald-600">{stats.completed}</p>
                </div>
                <div>
                    <p className="text-muted-foreground">Failed</p>
                    <p className={cn("font-semibold tabular-nums", stats.failed > 0 && "text-red-600")}>{stats.failed}</p>
                </div>
            </div>
        </div>
    );
}

const stateColors: Record<string, { bg: string; text: string; dot: string }> = {
    running: { bg: "bg-emerald-500/10", text: "text-emerald-600", dot: "bg-emerald-500" },
    stopped: { bg: "bg-zinc-500/10", text: "text-zinc-500", dot: "bg-zinc-400" },
    pending: { bg: "bg-amber-500/10", text: "text-amber-600", dot: "bg-amber-500" },
    stopping: { bg: "bg-orange-500/10", text: "text-orange-600", dot: "bg-orange-500" },
    terminated: { bg: "bg-red-500/10", text: "text-red-600", dot: "bg-red-500" },
    unknown: { bg: "bg-zinc-500/10", text: "text-zinc-500", dot: "bg-zinc-400" },
};

function InstanceCard({ instance, onStart, onStop, isControlling, scalerState }: {
    instance: EC2Instance;
    onStart: () => void;
    onStop: () => void;
    isControlling: boolean;
    scalerState?: any;
}) {
    const colors = stateColors[instance.state] || stateColors.unknown;
    const isRunning = instance.state === "running";
    const isStopped = instance.state === "stopped";
    const isTransitioning = instance.state === "pending" || instance.state === "stopping";

    // Countdown timer for burst instance
    const [now, setNow] = useState(Date.now());
    const isBurst = instance.role === "burst";

    // Tick every second for countdown
    useEffect(() => {
        if (!isBurst || !isRunning) return;
        const interval = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(interval);
    }, [isBurst, isRunning]);

    let shutdownCountdown: string | null = null;
    let countdownPct = 0;
    if (isBurst && isRunning && scalerState && !scalerState.error && scalerState.shutdownAt > 0) {
        const remaining = Math.max(0, scalerState.shutdownAt - now);
        const totalMs = scalerState.scaleDownIdleMs || 600000;
        countdownPct = Math.min(100, ((totalMs - remaining) / totalMs) * 100);
        if (remaining > 0) {
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            shutdownCountdown = `${mins}:${secs.toString().padStart(2, "0")}`;
        } else {
            shutdownCountdown = "Shutting down...";
        }
    }

    return (
        <Card className="relative overflow-hidden">
            {isRunning && <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {instance.role === "base" ? (
                            <IconCloud className="h-5 w-5 text-blue-500" />
                        ) : (
                            <IconBolt className="h-5 w-5 text-amber-500" />
                        )}
                        <div>
                            <CardTitle className="text-sm font-semibold">
                                {instance.role === "base" ? "Base Instance" : "Burst Instance"}
                            </CardTitle>
                            <p className="text-[10px] text-muted-foreground font-mono">{instance.id}</p>
                        </div>
                    </div>
                    <div className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border", colors.bg, colors.text)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot, isTransitioning && "animate-pulse")} />
                        {instance.state}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium">{instance.type || "-"}</p>
                    </div>
                    <div>
                        <p className="text-muted-foreground">IP</p>
                        <p className="font-mono font-medium">{instance.ip || "-"}</p>
                    </div>
                    {instance.label && (
                        <div>
                            <p className="text-muted-foreground">Config</p>
                            <p className="font-medium">{instance.label}</p>
                        </div>
                    )}
                    {instance.launchTime && (
                        <div>
                            <p className="text-muted-foreground">Launched</p>
                            <p className="font-medium">{new Date(instance.launchTime).toLocaleString()}</p>
                        </div>
                    )}
                </div>

                {/* Shutdown countdown for burst */}
                {isBurst && isRunning && shutdownCountdown && (
                    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-amber-600 font-medium">Auto-shutdown in</span>
                            <span className="font-mono font-bold text-amber-600 tabular-nums">{shutdownCountdown}</span>
                        </div>
                        <div className="w-full h-1.5 bg-amber-500/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                style={{ width: `${countdownPct}%` }}
                            />
                        </div>
                        <p className="text-[10px] text-muted-foreground">Queue empty — stops after {scalerState?.scaleDownIdleMs ? Math.round(scalerState.scaleDownIdleMs / 60000) : 10} min idle</p>
                    </div>
                )}
                {isBurst && isRunning && scalerState && !scalerState.error && scalerState.total > 0 && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-blue-600 font-medium">Processing jobs</span>
                            <span className="font-mono font-bold text-blue-600 tabular-nums">{scalerState.total} in queue</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">Timer resets while jobs are active</p>
                    </div>
                )}

                <div className="flex gap-2 pt-1">
                    {isStopped || isTransitioning ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                            disabled={isRunning || isTransitioning || isControlling}
                            onClick={onStart}
                        >
                            {isControlling ? <IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <IconPlayerPlay className="h-3.5 w-3.5 mr-1.5" />}
                            Start
                        </Button>
                    ) : (
                        <AlertDialog>
                            <AlertDialogTrigger render={
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                                    disabled={isRunning || isTransitioning || isControlling}
                                >
                                    {isControlling ? <IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <IconPlayerPlay className="h-3.5 w-3.5 mr-1.5" />}
                                    Start
                                </Button>
                            } />
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Start {instance.role === "base" ? "Base" : "Burst"} Instance?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will start EC2 instance {instance.id} ({instance.type}). It may take 30-60 seconds to become available.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={onStart}>Start Instance</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    {isRunning ? (
                        <AlertDialog>
                            <AlertDialogTrigger render={
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 text-red-600 border-red-500/30 hover:bg-red-500/10"
                                    disabled={isStopped || isTransitioning || isControlling}
                                >
                                    {isControlling ? <IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <IconPlayerStop className="h-3.5 w-3.5 mr-1.5" />}
                                    Stop
                                </Button>
                            } />
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Stop {instance.role === "base" ? "Base" : "Burst"} Instance?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will stop EC2 instance {instance.id}. Any running jobs will be interrupted. Are you sure?
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={onStop} className="bg-red-600 hover:bg-red-700 text-white">Stop Instance</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600 border-red-500/30 hover:bg-red-500/10"
                            disabled={isStopped || isTransitioning || isControlling}
                            onClick={onStop}
                        >
                            {isControlling ? <IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <IconPlayerStop className="h-3.5 w-3.5 mr-1.5" />}
                            Stop
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function WorkerStatsSection({ title, icon: Icon, data, color }: {
    title: string;
    icon: React.ElementType;
    data: any;
    color: string;
}) {
    if (!data || data.error) {
        return (
            <Card className="relative overflow-hidden">
                <div className={cn("absolute top-0 left-0 right-0 h-0.5", color)} />
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    {data?.error || `${title} unavailable`}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 right-0 h-0.5", color)} />
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {title}
                    {data.mode === "burst" && <Badge variant="outline" className="text-[10px] ml-1">burst</Badge>}
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Uptime + System row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground mb-1">Uptime</p>
                        <p className="text-lg font-bold">{data.uptime_seconds ? formatUptime(data.uptime_seconds) : "-"}</p>
                    </div>
                    {data.system && (
                        <div>
                            <p className="text-xs text-muted-foreground mb-1">RAM</p>
                            <p className="text-lg font-bold">{data.system.memory_used_pct}</p>
                            <p className="text-[10px] text-muted-foreground">
                                {data.system.memory_used_mb}MB / {data.system.memory_total_mb}MB · {data.system.cpu_count} CPUs · Load {data.system.load_avg_1m}
                            </p>
                        </div>
                    )}
                </div>

                {/* Git */}
                {data.git && !data.git.error && (
                    <div className="text-xs">
                        <p className="text-muted-foreground mb-1">Git</p>
                        <p className="font-mono font-semibold">{data.git.short} <span className="font-normal text-muted-foreground">· {data.git.branch}</span></p>
                        <p className="text-muted-foreground truncate">{data.git.message}</p>
                    </div>
                )}

                {/* Workers */}
                {data.workers && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Workers</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(data.workers)
                                .filter(([k]) => k !== "total_concurrency")
                                .map(([name, info]: [string, any]) => (
                                    <div key={name} className={cn(
                                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px]",
                                        info.running ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5"
                                    )}>
                                        <span className={cn("w-1.5 h-1.5 rounded-full", info.running ? "bg-emerald-500" : "bg-red-500")} />
                                        {name.replace("Worker", "")} ×{info.concurrency}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                {/* Queues */}
                {data.queues && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Queues</p>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.entries(data.queues).map(([name, stats]: [string, any]) => (
                                <QueueCard key={name} name={name} stats={stats} />
                            ))}
                        </div>
                    </div>
                )}

                {/* Redis */}
                {data.redis && (
                    <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">Redis:</span>
                        <Badge variant={data.redis.status === "healthy" ? "default" : "destructive"} className="text-[10px]">
                            {data.redis.status}
                        </Badge>
                        <span className="tabular-nums">{data.redis.latency_ms}ms</span>
                        {data.redis.memory?.used_memory_human && (
                            <span className="text-muted-foreground">{data.redis.memory.used_memory_human}</span>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function BurstLogsSection() {
    const { data, isLoading, refetch, isRefetching } = useBurstLogs();

    if (isLoading) return <Skeleton className="h-48" />;
    if (!data || data.error) {
        return (
            <Card>
                <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    {(data as any)?.error || "Burst logs unavailable"}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <IconFileText className="h-4 w-4" /> Burst Instance Logs
                        <Badge variant="outline" className="text-[10px] ml-1">{data.total} snapshots</Badge>
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="text-xs">
                        <IconRefresh className={cn("h-3.5 w-3.5 mr-1.5", isRefetching && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Latest logs - quick access */}
                {(data.latest.out || data.latest.error) && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Latest (live-updated on burst shutdown)</p>
                        <div className="flex gap-2">
                            {data.latest.out && (
                                <a href={data.latest.out.url} target="_blank" rel="noopener noreferrer"
                                    className="flex-1 flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 hover:bg-emerald-500/10 transition-colors">
                                    <IconDownload className="h-4 w-4 text-emerald-600 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-emerald-600">stdout (latest)</p>
                                        <p className="text-[10px] text-muted-foreground">{formatBytes(data.latest.out.size)}</p>
                                    </div>
                                </a>
                            )}
                            {data.latest.error && (
                                <a href={data.latest.error.url} target="_blank" rel="noopener noreferrer"
                                    className="flex-1 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3 hover:bg-red-500/10 transition-colors">
                                    <IconDownload className="h-4 w-4 text-red-600 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium text-red-600">stderr (latest)</p>
                                        <p className="text-[10px] text-muted-foreground">{formatBytes(data.latest.error.size)}</p>
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Historical logs */}
                {data.historical.length > 0 && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2">Historical snapshots</p>
                        <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-lg border p-2">
                            {data.historical.map((log: any) => (
                                <a key={log.key} href={log.url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors text-xs group">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className={cn(
                                            "w-1.5 h-1.5 rounded-full shrink-0",
                                            log.type === "error" ? "bg-red-500" : "bg-emerald-500"
                                        )} />
                                        <span className="font-mono truncate">{log.key.split("/").pop()}</span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0 ml-3">
                                        <span className="text-muted-foreground tabular-nums">{formatBytes(log.size)}</span>
                                        <span className="text-muted-foreground tabular-nums">{new Date(log.lastModified).toLocaleString()}</span>
                                        <IconDownload className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {data.total === 0 && !data.latest.out && !data.latest.error && (
                    <p className="text-xs text-muted-foreground text-center py-4">
                        No burst logs yet. Logs are synced to R2 when the burst instance shuts down.
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

export default function WorkerDashboardPage() {
    const { data: baseData, isLoading: baseLoading, refetch: baseRefetch, isRefetching } = useWorkerStatus();
    const { data: burstData, isLoading: burstLoading, refetch: burstRefetch } = useBurstWorkerStatus();
    const { data: ec2Data, isLoading: ec2Loading, refetch: ec2Refetch } = useEC2Status();
    const { data: scalerData, refetch: scalerRefetch } = useScalerState();
    const controlEC2 = useControlEC2();
    const forceCheck = useForceScalerCheck();
    const [controllingId, setControllingId] = useState<string | null>(null);

    const handleEC2Action = (instanceId: string, action: "start" | "stop") => {
        setControllingId(instanceId);
        controlEC2.mutate({ instanceId, action }, {
            onSettled: () => setTimeout(() => setControllingId(null), 3000),
        });
    };

    const refreshAll = () => { baseRefetch(); burstRefetch(); ec2Refetch(); scalerRefetch(); };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">Worker Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Infrastructure, queues, and instance management</p>
                </div>
                <Button variant="outline" size="sm" onClick={refreshAll} disabled={isRefetching}>
                    <IconRefresh className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* EC2 Instances */}
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <IconCloud className="h-4 w-4" /> EC2 Instances
                </h2>
                {ec2Loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-48" />
                        <Skeleton className="h-48" />
                    </div>
                ) : ec2Data ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <InstanceCard
                            instance={ec2Data.base}
                            onStart={() => handleEC2Action(ec2Data.base.id, "start")}
                            onStop={() => handleEC2Action(ec2Data.base.id, "stop")}
                            isControlling={controllingId === ec2Data.base.id}
                        />
                        <InstanceCard
                            instance={ec2Data.burst}
                            onStart={() => handleEC2Action(ec2Data.burst.id, "start")}
                            onStop={() => handleEC2Action(ec2Data.burst.id, "stop")}
                            isControlling={controllingId === ec2Data.burst.id}
                            scalerState={scalerData}
                        />
                    </div>
                ) : (
                    <Card>
                        <CardContent className="py-6 text-center text-sm text-muted-foreground">
                            EC2 status unavailable — check env vars
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Autoscaler */}
            {scalerData && !scalerData.error && (
                <Card>
                    <CardContent className="py-3 px-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs">
                                <span className="font-medium text-muted-foreground">Autoscaler</span>
                                <span>Queue: <span className="font-mono font-semibold tabular-nums">{scalerData.total}</span> jobs</span>
                                <span>Burst: <span className="font-semibold">{scalerData.burstState}</span></span>
                                <span>Check interval: <span className="font-mono tabular-nums">{scalerData.checkIntervalMs / 1000}s</span></span>
                                <span>Idle timeout: <span className="font-mono tabular-nums">{Math.round(scalerData.scaleDownIdleMs / 60000)}min</span></span>
                                {scalerData.updatedAt && (
                                    <span className="text-muted-foreground">Last check: {new Date(scalerData.updatedAt).toLocaleTimeString()}</span>
                                )}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => forceCheck.mutate()}
                                disabled={forceCheck.isPending}
                                className="text-xs"
                            >
                                <IconRefresh className={cn("h-3.5 w-3.5 mr-1.5", forceCheck.isPending && "animate-spin")} />
                                Force Check
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Burst Logs */}
            <BurstLogsSection />

            {/* Worker Stats - Side by Side */}
            <div>
                <h2 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <IconServer className="h-4 w-4" /> Worker Status
                </h2>
                {baseLoading && burstLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-64" />
                        <Skeleton className="h-64" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <WorkerStatsSection
                            title="Base Worker (8GB)"
                            icon={IconCloud}
                            data={baseData}
                            color="bg-blue-500"
                        />
                        <WorkerStatsSection
                            title="Burst Worker (32GB)"
                            icon={IconBolt}
                            data={burstData}
                            color="bg-amber-500"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
