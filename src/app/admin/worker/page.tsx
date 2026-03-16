"use client";

import { useState } from "react";
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
} from "@tabler/icons-react";
import { useWorkerStatus, useEC2Status, useControlEC2, useBurstWorkerStatus } from "@/hooks/useAdmin";
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

function InstanceCard({ instance, onStart, onStop, isControlling }: {
    instance: EC2Instance;
    onStart: () => void;
    onStop: () => void;
    isControlling: boolean;
}) {
    const colors = stateColors[instance.state] || stateColors.unknown;
    const isRunning = instance.state === "running";
    const isStopped = instance.state === "stopped";
    const isTransitioning = instance.state === "pending" || instance.state === "stopping";

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
                <div className="flex gap-2 pt-1">
                    <AlertDialog>
                        <AlertDialogTrigger
                            className={cn("flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                                "text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20",
                                (isRunning || isTransitioning || isControlling) && "opacity-50 pointer-events-none"
                            )}
                        >
                            {isControlling ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" /> : <IconPlayerPlay className="h-3.5 w-3.5" />}
                            Start
                        </AlertDialogTrigger>
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
                    <AlertDialog>
                        <AlertDialogTrigger
                            className={cn("flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
                                "text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950/20",
                                (isStopped || isTransitioning || isControlling) && "opacity-50 pointer-events-none"
                            )}
                        >
                            {isControlling ? <IconLoader2 className="h-3.5 w-3.5 animate-spin" /> : <IconPlayerStop className="h-3.5 w-3.5" />}
                            Stop
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Stop {instance.role === "base" ? "Base" : "Burst"} Instance?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will stop EC2 instance {instance.id}. Any running jobs will be interrupted. Are you sure?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={onStop} className="bg-red-600 hover:bg-red-700">Stop Instance</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
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

export default function WorkerDashboardPage() {
    const { data: baseData, isLoading: baseLoading, refetch: baseRefetch, isRefetching } = useWorkerStatus();
    const { data: burstData, isLoading: burstLoading, refetch: burstRefetch } = useBurstWorkerStatus();
    const { data: ec2Data, isLoading: ec2Loading, refetch: ec2Refetch } = useEC2Status();
    const controlEC2 = useControlEC2();
    const [controllingId, setControllingId] = useState<string | null>(null);

    const handleEC2Action = (instanceId: string, action: "start" | "stop") => {
        setControllingId(instanceId);
        controlEC2.mutate({ instanceId, action }, {
            onSettled: () => setTimeout(() => setControllingId(null), 3000),
        });
    };

    const refreshAll = () => { baseRefetch(); burstRefetch(); ec2Refetch(); };

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
