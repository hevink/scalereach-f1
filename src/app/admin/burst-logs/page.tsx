"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    IconRefresh, IconDownload, IconBolt, IconFileText,
    IconLoader2, IconCloudUpload, IconEye, IconX,
    IconLivePhoto, IconArchive,
} from "@tabler/icons-react";
import {
    useBurstLogs, useSyncBurstLogs, useBurstLogContent, useBurstLogsLive,
} from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";
import type { BurstLogFile } from "@/lib/api/admin";

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function colorClass(msg: string): string {
    if (/error|err:|failed|exception|fatal/i.test(msg)) return "text-red-400";
    if (/warn|warning/i.test(msg)) return "text-yellow-400";
    if (/✓|success|done|complete|started|running|healthy/i.test(msg)) return "text-emerald-400";
    if (/\[info\]|info:/i.test(msg)) return "text-blue-400";
    return "text-zinc-300";
}

function LogContent({ content, isLoading, error }: {
    content: string | undefined;
    isLoading: boolean;
    error: any;
}) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
            </div>
        );
    }
    if (error) {
        const msg = (error as any)?.response?.data?.error || (error as any)?.message || "Failed to load";
        return <p className="text-sm text-red-500 text-center py-8">{msg}</p>;
    }
    if (!content) {
        return <p className="text-zinc-600 text-center py-8">No log content</p>;
    }
    const lines = content.split("\n");
    return (
        <>
            <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed">
                {lines.map((line, i) => (
                    <div key={i} className="flex gap-3 py-px hover:bg-zinc-900/50 rounded">
                        <span className="text-zinc-600 select-none shrink-0 text-[11px] w-10 text-right tabular-nums">{i + 1}</span>
                        <span className={cn("whitespace-pre-wrap break-all", colorClass(line))}>{line}</span>
                    </div>
                ))}
            </div>
            <div className="flex gap-4 pt-2 text-[11px] text-zinc-500">
                <span>{lines.length} lines</span>
                <span>{formatBytes(content.length)}</span>
            </div>
        </>
    );
}

function LiveLogsTab() {
    const [logType, setLogType] = useState<"out" | "error">("out");
    const { data, isLoading, error, refetch, isRefetching } = useBurstLogsLive(logType, true);

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <IconLivePhoto className="h-4 w-4 text-emerald-500" />
                        Live Logs from Burst Instance
                        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1 inline-block" />
                            Auto-refresh 15s
                        </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="flex rounded-md border overflow-hidden">
                            <button
                                onClick={() => setLogType("out")}
                                className={cn("px-3 py-1.5 text-xs transition-colors",
                                    logType === "out" ? "bg-emerald-500/10 text-emerald-600 font-medium" : "text-muted-foreground hover:bg-muted"
                                )}
                            >stdout</button>
                            <button
                                onClick={() => setLogType("error")}
                                className={cn("px-3 py-1.5 text-xs border-l transition-colors",
                                    logType === "error" ? "bg-red-500/10 text-red-600 font-medium" : "text-muted-foreground hover:bg-muted"
                                )}
                            >stderr</button>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching} className="text-xs">
                            <IconRefresh className={cn("h-3.5 w-3.5 mr-1.5", isRefetching && "animate-spin")} />
                            Refresh
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <LogContent content={data} isLoading={isLoading} error={error} />
            </CardContent>
        </Card>
    );
}

function R2LogViewer({ logKey, onClose }: { logKey: string; onClose: () => void }) {
    const { data: content, isLoading, error } = useBurstLogContent(logKey);
    const filename = logKey.split("/").pop() || logKey;
    const isError = logKey.includes("error");

    return (
        <Card className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 right-0 h-0.5", isError ? "bg-red-500" : "bg-emerald-500")} />
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 font-mono">
                        <IconFileText className="h-4 w-4" /> {filename}
                    </CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                        <IconX className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <LogContent content={content} isLoading={isLoading} error={error} />
            </CardContent>
        </Card>
    );
}

function R2SnapshotsTab() {
    const { data, isLoading, refetch, isRefetching } = useBurstLogs();
    const syncLogs = useSyncBurstLogs();
    const [viewingLog, setViewingLog] = useState<string | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Logs saved to R2 on burst shutdown or manual sync</p>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => syncLogs.mutate()} disabled={syncLogs.isPending}>
                        {syncLogs.isPending ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconCloudUpload className="h-4 w-4 mr-2" />}
                        Sync to R2 Now
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                        <IconRefresh className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} /> Refresh
                    </Button>
                </div>
            </div>

            {syncLogs.isSuccess && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-600">
                    Logs uploaded to R2. Hit Refresh to see them.
                </div>
            )}
            {syncLogs.isError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-600">
                    {(syncLogs.error as any)?.response?.data?.error || "Sync failed — burst instance may not be running"}
                </div>
            )}

            {viewingLog && <R2LogViewer logKey={viewingLog} onClose={() => setViewingLog(null)} />}

            {isLoading ? (
                <Skeleton className="h-64" />
            ) : !data || (data as any).error ? (
                <Card>
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                        {(data as any)?.error || "No R2 logs available"}
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Latest */}
                    {(data.latest.out || data.latest.error) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {data.latest.out && (
                                <button onClick={() => setViewingLog(data.latest.out!.key)}
                                    className={cn("flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                        viewingLog === data.latest.out.key ? "border-emerald-500 bg-emerald-500/10" : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10")}>
                                    <IconEye className="h-5 w-5 text-emerald-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-emerald-600">stdout (latest)</p>
                                        <p className="text-xs text-muted-foreground">{formatBytes(data.latest.out.size)} · {new Date(data.latest.out.lastModified).toLocaleString()}</p>
                                    </div>
                                </button>
                            )}
                            {data.latest.error && (
                                <button onClick={() => setViewingLog(data.latest.error!.key)}
                                    className={cn("flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                        viewingLog === data.latest.error.key ? "border-red-500 bg-red-500/10" : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10")}>
                                    <IconEye className="h-5 w-5 text-red-600 shrink-0" />
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-medium text-red-600">stderr (latest)</p>
                                        <p className="text-xs text-muted-foreground">{formatBytes(data.latest.error.size)} · {new Date(data.latest.error.lastModified).toLocaleString()}</p>
                                    </div>
                                </button>
                            )}
                        </div>
                    )}

                    {/* Historical */}
                    {data.historical.length > 0 ? (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-semibold">
                                    Historical <Badge variant="outline" className="text-[10px] ml-2">{data.total}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-lg border divide-y max-h-80 overflow-y-auto">
                                    {data.historical.map((log: BurstLogFile) => (
                                        <div key={log.key} className={cn("flex items-center justify-between px-4 py-2.5 text-xs cursor-pointer transition-colors",
                                            viewingLog === log.key ? "bg-muted" : "hover:bg-muted/50")} onClick={() => setViewingLog(log.key)}>
                                            <div className="flex items-center gap-2 min-w-0">
                                                <span className={cn("w-2 h-2 rounded-full shrink-0", log.type === "error" ? "bg-red-500" : "bg-emerald-500")} />
                                                <span className="font-mono truncate">{log.key.split("/").pop()}</span>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0 ml-4">
                                                <span className="text-muted-foreground tabular-nums">{formatBytes(log.size)}</span>
                                                <span className="text-muted-foreground tabular-nums">{new Date(log.lastModified).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ) : !data.latest.out && !data.latest.error ? (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                No snapshots yet. Click "Sync to R2 Now" while burst is running, or wait for auto-shutdown.
                            </CardContent>
                        </Card>
                    ) : null}
                </>
            )}
        </div>
    );
}

export default function BurstLogsPage() {
    const [tab, setTab] = useState<"live" | "r2">("live");

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <IconBolt className="h-6 w-6 text-amber-500" /> Burst Instance Logs
                    </h1>
                    <p className="text-sm text-muted-foreground">View logs from the burst EC2 instance</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 rounded-lg border p-1 w-fit">
                <button onClick={() => setTab("live")}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors",
                        tab === "live" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted")}>
                    <IconLivePhoto className="h-4 w-4" /> Live
                </button>
                <button onClick={() => setTab("r2")}
                    className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm transition-colors",
                        tab === "r2" ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground hover:bg-muted")}>
                    <IconArchive className="h-4 w-4" /> R2 Snapshots
                </button>
            </div>

            {tab === "live" ? <LiveLogsTab /> : <R2SnapshotsTab />}
        </div>
    );
}
