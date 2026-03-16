"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    IconRefresh, IconServer, IconCpu, IconDatabase,
    IconGitBranch, IconClock, IconActivity, IconPlayerPlay,
    IconPlayerStop, IconCloud, IconBolt, IconLoader2,
} from "@tabler/icons-react";
import { useWorkerStatus, useEC2Status, useControlEC2 } from "@/hooks/useAdmin";
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
            {isRunning && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-500" />
            )}
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
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                        disabled={isRunning || isTransitioning || isControlling}
                        onClick={onStart}
                    >
                        {isControlling ? (
                            <IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <IconPlayerPlay className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Start
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                        disabled={isStopped || isTransitioning || isControlling}
                        onClick={onStop}
                    >
                        {isControlling ? (
                            <IconLoader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        ) : (
                            <IconPlayerStop className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        Stop
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default function WorkerDashboardPage() {
    const { data, isLoading, refetch, isRefetching } = useWorkerStatus();
    const { data: ec2Data, isLoading: ec2Loading, refetch: ec2Refetch } = useEC2Status();
    const controlEC2 = useControlEC2();
    const [controllingId, setControllingId] = useState<string | null>(null);

    const handleEC2Action = (instanceId: string, action: "start" | "stop") => {
        setControllingId(instanceId);
        controlEC2.mutate({ instanceId, action }, {
            onSettled: () => setTimeout(() => setControllingId(null), 3000),
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">Worker Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Infrastructure, queues, and instance management</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { refetch(); ec2Refetch(); }} disabled={isRefetching}>
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

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}
                </div>
            ) : data?.error ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-red-500 text-sm">{data.error}</p>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Top row: uptime, system, git */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Uptime</CardTitle>
                                <IconClock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <p className="text-2xl font-bold">{data?.uptime_seconds ? formatUptime(data.uptime_seconds) : "-"}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Since {data?.timestamp ? new Date(new Date(data.timestamp).getTime() - (data.uptime_seconds || 0) * 1000).toLocaleString() : "-"}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">System</CardTitle>
                                <IconCpu className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {data?.system ? (
                                    <>
                                        <p className="text-lg font-bold">{data.system.memory_used_pct} RAM</p>
                                        <p className="text-xs text-muted-foreground">
                                            {data.system.memory_used_mb}MB / {data.system.memory_total_mb}MB
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Load: {data.system.load_avg_1m} · {data.system.cpu_count} CPUs · Bun {data.system.bun_version}
                                        </p>
                                    </>
                                ) : <p className="text-sm text-muted-foreground">-</p>}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Git</CardTitle>
                                <IconGitBranch className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent className="space-y-1">
                                {data?.git && !data.git.error ? (
                                    <>
                                        <p className="text-sm font-mono font-semibold">{data.git.short}</p>
                                        <p className="text-xs text-muted-foreground truncate" title={data.git.message}>{data.git.message}</p>
                                        <p className="text-xs text-muted-foreground">{data.git.branch} · {data.git.author}</p>
                                    </>
                                ) : <p className="text-sm text-muted-foreground">unavailable</p>}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Workers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <IconServer className="h-4 w-4" /> Workers
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                                {data?.workers && Object.entries(data.workers)
                                    .filter(([k]) => k !== "total_concurrency")
                                    .map(([name, info]: [string, any]) => (
                                        <div key={name} className="rounded-lg border p-3 text-center">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium mb-2",
                                                info.running
                                                    ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                                    : "bg-red-500/10 text-red-600 border border-red-500/20"
                                            )}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", info.running ? "bg-emerald-500" : "bg-red-500")} />
                                                {info.running ? "Running" : "Stopped"}
                                            </div>
                                            <p className="text-xs font-medium truncate">{name.replace("Worker", "")}</p>
                                            <p className="text-[10px] text-muted-foreground">×{info.concurrency}</p>
                                        </div>
                                    ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Queues */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <IconActivity className="h-4 w-4" /> Queues
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {data?.queues && Object.entries(data.queues).map(([name, stats]: [string, any]) => (
                                    <QueueCard key={name} name={name} stats={stats} />
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Redis */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <IconDatabase className="h-4 w-4" /> Redis
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data?.redis ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Status</p>
                                        <Badge variant={data.redis.status === "healthy" ? "default" : "destructive"} className="mt-1">
                                            {data.redis.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Latency</p>
                                        <p className="font-semibold tabular-nums">{data.redis.latency_ms}ms</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Version</p>
                                        <p className="font-mono text-xs">{data.redis.version || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Memory</p>
                                        <p className="font-mono text-xs">{data.redis.memory?.used_memory_human || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Clients</p>
                                        <p className="font-semibold tabular-nums">{data.redis.clients?.connected_clients || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">BullMQ Keys</p>
                                        <p className="font-semibold tabular-nums">{data.redis.bullmq_keys_count ?? "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Commands</p>
                                        <p className="font-mono text-xs">{data.redis.stats?.total_commands_processed || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground text-xs">Uptime</p>
                                        <p className="font-mono text-xs">{data.redis.stats?.uptime_in_seconds ? formatUptime(Number(data.redis.stats.uptime_in_seconds)) : "-"}</p>
                                    </div>
                                </div>
                            ) : <p className="text-sm text-muted-foreground">-</p>}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
