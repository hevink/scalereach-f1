"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    IconCookie, IconShieldCheck, IconTerminal2,
    IconPlayerPlay, IconCheck, IconX, IconLoader2,
    IconRefresh, IconClock,
} from "@tabler/icons-react";
import { useYouTubeHealth, useTestYouTubeCookie, useTestBurstYouTube } from "@/hooks/useAdmin";
import { cn } from "@/lib/utils";

function StatusBadge({ status, labels }: {
    status: string;
    labels: Record<string, { label: string; variant: "ok" | "warn" | "err" }>;
}) {
    const config = labels[status] || { label: status, variant: "err" as const };
    const colorMap = {
        ok: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        warn: "bg-amber-500/10 text-amber-600 border-amber-500/20",
        err: "bg-red-500/10 text-red-600 border-red-500/20",
    };
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", colorMap[config.variant])}>
            {config.variant === "ok" && <IconCheck className="h-3 w-3" />}
            {config.variant === "warn" && <IconClock className="h-3 w-3" />}
            {config.variant === "err" && <IconX className="h-3 w-3" />}
            {config.label}
        </span>
    );
}

export default function YouTubeHealthPage() {
    const { data, isLoading, refetch, isRefetching } = useYouTubeHealth();
    const testMutation = useTestYouTubeCookie();
    const burstTestMutation = useTestBurstYouTube();
    const [testUrl, setTestUrl] = useState("https://www.youtube.com/watch?v=dQw4w9WgXcQ");

    const handleTest = () => {
        if (!testUrl.trim()) return;
        testMutation.mutate(testUrl.trim());
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold">YouTube Health</h1>
                    <p className="text-sm text-muted-foreground">Cookie status, POT server, and yt-dlp diagnostics</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isRefetching}>
                    <IconRefresh className={cn("h-4 w-4 mr-2", isRefetching && "animate-spin")} />
                    Refresh
                </Button>
            </div>

            {/* Status cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Cookie status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">YouTube Cookies</CardTitle>
                        <IconCookie className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-20 w-full" /> : (
                            <div className="space-y-3">
                                <StatusBadge
                                    status={data?.cookie?.status || "unknown"}
                                    labels={{
                                        valid: { label: "Valid", variant: "ok" },
                                        expired: { label: "Expired", variant: "err" },
                                        missing: { label: "Missing", variant: "err" },
                                        error: { label: "Error", variant: "err" },
                                    }}
                                />
                                {data?.cookie?.daysLeft != null && (
                                    <p className={cn(
                                        "text-2xl font-bold tabular-nums",
                                        data.cookie.daysLeft > 7 ? "text-emerald-600" :
                                            data.cookie.daysLeft > 0 ? "text-amber-600" : "text-red-600"
                                    )}>
                                        {data.cookie.daysLeft > 0 ? `${data.cookie.daysLeft} days left` : "Expired"}
                                    </p>
                                )}
                                {data?.cookie?.expiry && (
                                    <p className="text-xs text-muted-foreground">
                                        Expires: {new Date(data.cookie.expiry).toLocaleDateString()}
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground font-mono truncate" title={data?.cookie?.path}>
                                    {data?.cookie?.count || 0} cookies loaded
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* POT server status */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">POT Server</CardTitle>
                        <IconShieldCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-20 w-full" /> : (
                            <div className="space-y-3">
                                <StatusBadge
                                    status={data?.pot?.status || "unknown"}
                                    labels={{
                                        running: { label: "Running", variant: "ok" },
                                        stopped: { label: "Stopped", variant: "err" },
                                        not_configured: { label: "Not Configured", variant: "warn" },
                                    }}
                                />
                                <p className="text-2xl font-bold">
                                    {data?.pot?.status === "running" ? "Online" : "Offline"}
                                </p>
                                {data?.pot?.url && (
                                    <p className="text-xs text-muted-foreground font-mono">{data.pot.url}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    bgutil Proof of Origin Token provider
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* yt-dlp version */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">yt-dlp</CardTitle>
                        <IconTerminal2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {isLoading ? <Skeleton className="h-20 w-full" /> : (
                            <div className="space-y-3">
                                <Badge variant="secondary" className="font-mono">
                                    {data?.ytdlp?.version || "unknown"}
                                </Badge>
                                <p className="text-2xl font-bold font-mono">
                                    {data?.ytdlp?.version || "-"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Keep updated for best compatibility
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Live test */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <IconPlayerPlay className="h-4 w-4" />
                        Live Cookie Test
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Test if yt-dlp can download from YouTube using current cookies and POT server
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={testUrl}
                            onChange={(e) => setTestUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="font-mono text-sm"
                            onKeyDown={(e) => e.key === "Enter" && handleTest()}
                        />
                        <Button onClick={handleTest} disabled={testMutation.isPending} size="sm">
                            {testMutation.isPending ? (
                                <><IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> Base...</>
                            ) : (
                                "Test Base (8GB)"
                            )}
                        </Button>
                        <Button
                            onClick={() => { if (testUrl.trim()) burstTestMutation.mutate(testUrl.trim()); }}
                            disabled={burstTestMutation.isPending}
                            variant="outline"
                            size="sm"
                        >
                            {burstTestMutation.isPending ? (
                                <><IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> Burst...</>
                            ) : (
                                "Test Burst (32GB)"
                            )}
                        </Button>
                    </div>

                    {/* Base test result */}
                    {testMutation.data?.test && (
                        <div className={cn(
                            "rounded-lg border p-4 space-y-2",
                            testMutation.data.test.ok
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : "bg-red-500/5 border-red-500/20"
                        )}>
                            <div className="flex items-center gap-2">
                                {testMutation.data.test.ok ? (
                                    <IconCheck className="h-5 w-5 text-emerald-600" />
                                ) : (
                                    <IconX className="h-5 w-5 text-red-600" />
                                )}
                                <span className={cn(
                                    "font-semibold",
                                    testMutation.data.test.ok ? "text-emerald-600" : "text-red-600"
                                )}>
                                    Base (8GB) — {testMutation.data.test.ok ? "Working" : "Failed"}
                                </span>
                                <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
                                    {testMutation.data.test.elapsed_ms}ms
                                </Badge>
                            </div>

                            {testMutation.data.test.ok && testMutation.data.test.videoInfo && (
                                <div className="text-sm space-y-1 pt-2 border-t border-border/50">
                                    <p><span className="text-muted-foreground">Title:</span> {testMutation.data.test.videoInfo.title}</p>
                                    <p><span className="text-muted-foreground">Channel:</span> {testMutation.data.test.videoInfo.channelName}</p>
                                    <p><span className="text-muted-foreground">Duration:</span> {Math.floor(testMutation.data.test.videoInfo.duration / 60)}m {testMutation.data.test.videoInfo.duration % 60}s</p>
                                </div>
                            )}

                            {!testMutation.data.test.ok && testMutation.data.test.error && (
                                <pre className="text-xs text-red-500 font-mono whitespace-pre-wrap mt-2 p-2 bg-red-500/5 rounded">
                                    {testMutation.data.test.error}
                                </pre>
                            )}
                        </div>
                    )}

                    {testMutation.error && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                            <p className="text-sm text-red-600">
                                Base — Failed to reach worker: {(testMutation.error as Error).message}
                            </p>
                        </div>
                    )}

                    {/* Burst test result */}
                    {burstTestMutation.data?.test && (
                        <div className={cn(
                            "rounded-lg border p-4 space-y-2",
                            burstTestMutation.data.test.ok
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : "bg-red-500/5 border-red-500/20"
                        )}>
                            <div className="flex items-center gap-2">
                                {burstTestMutation.data.test.ok ? (
                                    <IconCheck className="h-5 w-5 text-emerald-600" />
                                ) : (
                                    <IconX className="h-5 w-5 text-red-600" />
                                )}
                                <span className={cn(
                                    "font-semibold",
                                    burstTestMutation.data.test.ok ? "text-emerald-600" : "text-red-600"
                                )}>
                                    Burst (32GB) — {burstTestMutation.data.test.ok ? "Working" : "Failed"}
                                </span>
                                {burstTestMutation.data.test.elapsed_ms && (
                                    <Badge variant="secondary" className="ml-auto text-xs tabular-nums">
                                        {burstTestMutation.data.test.elapsed_ms}ms
                                    </Badge>
                                )}
                            </div>

                            {burstTestMutation.data.test.ok && burstTestMutation.data.test.videoInfo && (
                                <div className="text-sm space-y-1 pt-2 border-t border-border/50">
                                    <p><span className="text-muted-foreground">Title:</span> {burstTestMutation.data.test.videoInfo.title}</p>
                                    <p><span className="text-muted-foreground">Channel:</span> {burstTestMutation.data.test.videoInfo.channelName}</p>
                                    <p><span className="text-muted-foreground">Duration:</span> {Math.floor(burstTestMutation.data.test.videoInfo.duration / 60)}m {burstTestMutation.data.test.videoInfo.duration % 60}s</p>
                                </div>
                            )}

                            {!burstTestMutation.data.test.ok && burstTestMutation.data.test.error && (
                                <pre className="text-xs text-red-500 font-mono whitespace-pre-wrap mt-2 p-2 bg-red-500/5 rounded">
                                    {burstTestMutation.data.test.error}
                                </pre>
                            )}
                        </div>
                    )}

                    {burstTestMutation.error && (
                        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
                            <p className="text-sm text-red-600">
                                Burst — Failed to reach worker: {(burstTestMutation.error as Error).message}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
