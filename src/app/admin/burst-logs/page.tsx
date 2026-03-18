"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    IconRefresh, IconDownload, IconBolt, IconFileText,
    IconLoader2, IconCloudUpload, IconEye, IconX,
} from "@tabler/icons-react";
import { useBurstLogs, useSyncBurstLogs, useBurstLogContent } from "@/hooks/useAdmin";
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

function LogViewer({ logKey, onClose }: { logKey: string; onClose: () => void }) {
    const { data: content, isLoading, error } = useBurstLogContent(logKey);
    const filename = logKey.split("/").pop() || logKey;
    const isError = logKey.includes("error");

    return (
        <Card className="relative overflow-hidden">
            <div className={cn("absolute top-0 left-0 right-0 h-0.5", isError ? "bg-red-500" : "bg-emerald-500")} />
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 font-mono">
                        <IconFileText className="h-4 w-4" />
                        {filename}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/admin/burst-logs/content?key=${encodeURIComponent(logKey)}`}
                            target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="text-xs h-7">
                                <IconDownload className="h-3.5 w-3.5 mr-1" /> Download
                            </Button>
                        </a>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                            <IconX className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <IconLoader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading log content...</span>
                    </div>
                ) : error ? (
                    <p className="text-sm text-red-500 text-center py-8">Failed to load log content</p>
                ) : (
                    <div className="max-h-[60vh] overflow-y-auto rounded-lg bg-zinc-950 p-3 font-mono text-xs leading-relaxed">
                        {content ? content.split("\n").map((line, i) => (
                            <div key={i} className="flex gap-3 py-px hover:bg-zinc-900/50 rounded">
                                <span className="text-zinc-600 select-none shrink-0 text-[11px] w-10 text-right tabular-nums">{i + 1}</span>
                                <span className={cn("whitespace-pre-wrap break-all", colorClass(line))}>{line}</span>
                            </div>
                        )) : (
                            <p className="text-zinc-600 text-center py-8">Empty log file</p>
                        )}
                    </div>
                )}
                {content && (
                    <div className="flex gap-4 pt-2 text-[11px] text-zinc-500">
                        <span>{content.split("\n").length} lines</span>
                        <span>{formatBytes(content.length)}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function BurstLogsPage() {
    const { data, isLoading, refetch, isRefetching } = useBurstLogs();
    const syncLogs = useSyncBurstLogs();
    const [viewingLog, setViewingLog] = useState<string | null>(null);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <IconBolt className="h-6 w-6 text-amber-500" /> Burst Instance Logs
                    </h1>
                    <p className="text-sm text-muted-foreground">View and sync logs from the burst EC2 instance stored in R2</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="default"
                        size="sm"
                        onClick={() => syncLogs.mutate()}
                        disabled={syncLogs.isPending}
                    >
                        {syncLogs.isPending ? (
                            <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <IconCloudUpload className="h-4 w-4 mr-2" />
                        )}
                        Sync Logs Now
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                        <IconRefresh className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
                        Refresh
                    </Button>
                </div>
            </div>

            {syncLogs.isSuccess && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-600">
                    Log sync triggered — the autoscaler is pulling logs from the burst instance. They should appear in ~15-30 seconds. Hit Refresh to check.
                </div>
            )}

            {/* Log viewer */}
            {viewingLog && (
                <LogViewer logKey={viewingLog} onClose={() => setViewingLog(null)} />
            )}

            {isLoading ? (
                <div className="space-y-4">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-64" />
                </div>
            ) : !data || (data as any).error ? (
                <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">
                        {(data as any)?.error || "Burst logs unavailable — check R2 configuration"}
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Latest logs */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-semibold">Latest Logs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {data.latest.out || data.latest.error ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {data.latest.out && (
                                        <button
                                            onClick={() => setViewingLog(data.latest.out!.key)}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                                viewingLog === data.latest.out.key
                                                    ? "border-emerald-500 bg-emerald-500/10"
                                                    : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
                                            )}
                                        >
                                            <IconEye className="h-5 w-5 text-emerald-600 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-emerald-600">stdout (latest)</p>
                                                <p className="text-xs text-muted-foreground">{formatBytes(data.latest.out.size)} · {new Date(data.latest.out.lastModified).toLocaleString()}</p>
                                            </div>
                                            <IconDownload
                                                className="h-4 w-4 text-muted-foreground shrink-0"
                                                onClick={(e) => { e.stopPropagation(); window.open(data.latest.out!.url, "_blank"); }}
                                            />
                                        </button>
                                    )}
                                    {data.latest.error && (
                                        <button
                                            onClick={() => setViewingLog(data.latest.error!.key)}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg border p-4 text-left transition-colors",
                                                viewingLog === data.latest.error.key
                                                    ? "border-red-500 bg-red-500/10"
                                                    : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                                            )}
                                        >
                                            <IconEye className="h-5 w-5 text-red-600 shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-red-600">stderr (latest)</p>
                                                <p className="text-xs text-muted-foreground">{formatBytes(data.latest.error.size)} · {new Date(data.latest.error.lastModified).toLocaleString()}</p>
                                            </div>
                                            <IconDownload
                                                className="h-4 w-4 text-muted-foreground shrink-0"
                                                onClick={(e) => { e.stopPropagation(); window.open(data.latest.error!.url, "_blank"); }}
                                            />
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No logs yet. Click "Sync Logs Now" to pull logs from the burst instance, or wait for the next auto-shutdown.
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Historical logs */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold">
                                    Historical Snapshots
                                    <Badge variant="outline" className="text-[10px] ml-2">{data.total}</Badge>
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {data.historical.length > 0 ? (
                                <div className="rounded-lg border divide-y max-h-96 overflow-y-auto">
                                    {data.historical.map((log: BurstLogFile) => (
                                        <div
                                            key={log.key}
                                            className={cn(
                                                "flex items-center justify-between px-4 py-3 text-xs transition-colors cursor-pointer",
                                                viewingLog === log.key ? "bg-muted" : "hover:bg-muted/50"
                                            )}
                                            onClick={() => setViewingLog(log.key)}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full shrink-0",
                                                    log.type === "error" ? "bg-red-500" : "bg-emerald-500"
                                                )} />
                                                <span className="font-mono truncate">{log.key.split("/").pop()}</span>
                                                <Badge variant="outline" className="text-[10px] shrink-0">
                                                    {log.type === "error" ? "stderr" : "stdout"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 shrink-0 ml-4">
                                                <span className="text-muted-foreground tabular-nums">{formatBytes(log.size)}</span>
                                                <span className="text-muted-foreground tabular-nums">{new Date(log.lastModified).toLocaleString()}</span>
                                                <div className="flex gap-1">
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); setViewingLog(log.key); }}>
                                                        <IconEye className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); window.open(log.url, "_blank"); }}>
                                                        <IconDownload className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-6">
                                    No historical snapshots yet. Logs are saved each time the burst instance shuts down.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
