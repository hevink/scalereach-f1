"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    IconAlertTriangle, IconRefresh, IconVideo, IconScissors,
    IconUser, IconBuildingStore, IconChevronLeft, IconChevronRight,
    IconClock,
} from "@tabler/icons-react";
import { useFailedItems, useRetryVideo, useRetryClip } from "@/hooks/useAdmin";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";

export default function AdminFailedPage() {
    const [page, setPage] = useState(1);
    const { data, isLoading, refetch } = useFailedItems(page);
    const retryVideo = useRetryVideo();
    const retryClip = useRetryClip();

    const handleRetryVideo = async (videoId: string) => {
        try {
            await retryVideo.mutateAsync(videoId);
            toast.success("Video queued for retry");
        } catch {
            toast.error("Failed to retry video");
        }
    };

    const handleRetryClip = async (clipId: string) => {
        try {
            await retryClip.mutateAsync(clipId);
            toast.success("Clip reset - will regenerate on next video processing");
        } catch {
            toast.error("Failed to retry clip");
        }
    };

    const handleRetryAll = async (type: "videos" | "clips") => {
        if (!data) return;
        const items = type === "videos" ? data.failedVideos : data.failedClips;
        const results = await Promise.allSettled(
            items.map(item =>
                type === "videos"
                    ? retryVideo.mutateAsync(item.id)
                    : retryClip.mutateAsync(item.id)
            )
        );
        const succeeded = results.filter(r => r.status === "fulfilled").length;
        const failed = results.filter(r => r.status === "rejected").length;
        toast.success(`Retried ${succeeded} ${type}${failed > 0 ? `, ${failed} failed` : ""}`);
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                        <IconAlertTriangle className="h-6 w-6 text-red-500" />
                        Failed Items
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        All failed videos and clips - retry individually or all at once
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2 self-start">
                    <IconRefresh className="h-4 w-4" />
                    Refresh
                </Button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="border-red-200 dark:border-red-900">
                    <CardContent className="pt-4 pb-4">
                        {isLoading ? <Skeleton className="h-8 w-16" /> : (
                            <div className="text-3xl font-bold text-red-600 tabular-nums">
                                {data?.totalFailedVideos ?? 0}
                            </div>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <IconVideo className="h-3.5 w-3.5 text-red-500" /> Failed Videos
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-red-200 dark:border-red-900">
                    <CardContent className="pt-4 pb-4">
                        {isLoading ? <Skeleton className="h-8 w-16" /> : (
                            <div className="text-3xl font-bold text-red-600 tabular-nums">
                                {data?.totalFailedClips ?? 0}
                            </div>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <IconScissors className="h-3.5 w-3.5 text-red-500" /> Failed Clips
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="videos">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <TabsList>
                        <TabsTrigger value="videos" className="gap-1.5">
                            <IconVideo className="h-4 w-4" />
                            Videos
                            {data?.totalFailedVideos ? (
                                <Badge className="ml-1 bg-red-600 text-white text-xs">{data.totalFailedVideos}</Badge>
                            ) : null}
                        </TabsTrigger>
                        <TabsTrigger value="clips" className="gap-1.5">
                            <IconScissors className="h-4 w-4" />
                            Clips
                            {data?.totalFailedClips ? (
                                <Badge className="ml-1 bg-red-600 text-white text-xs">{data.totalFailedClips}</Badge>
                            ) : null}
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Failed Videos */}
                <TabsContent value="videos" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Failed Videos</CardTitle>
                                {data?.failedVideos.length ? (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleRetryAll("videos")}
                                        disabled={retryVideo.isPending}
                                        className="gap-2"
                                    >
                                        <IconRefresh className="h-4 w-4" />
                                        Retry All ({data.failedVideos.length})
                                    </Button>
                                ) : null}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                                </div>
                            ) : !data?.failedVideos.length ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                                    <IconVideo className="h-10 w-10 opacity-30" />
                                    <p className="text-sm">No failed videos 🎉</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {data.failedVideos.map((v) => (
                                        <div key={v.id} className="border border-red-200 dark:border-red-900 rounded-lg p-3 bg-red-50/30 dark:bg-red-950/10">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-sm truncate">{v.title || "Untitled video"}</span>
                                                        <Badge variant="outline" className="text-xs shrink-0">{v.sourceType}</Badge>
                                                    </div>
                                                    {v.errorMessage && (
                                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 line-clamp-2 font-mono bg-red-100 dark:bg-red-950/40 rounded px-2 py-1">
                                                            {v.errorMessage}
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                        {v.userName && (
                                                            <Link href={`/admin/users/${v.userId}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                                                <IconUser className="h-3 w-3" /> {v.userName}
                                                            </Link>
                                                        )}
                                                        {v.workspaceName && (
                                                            <span className="flex items-center gap-1">
                                                                <IconBuildingStore className="h-3 w-3" /> {v.workspaceName}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <IconClock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(v.updatedAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRetryVideo(v.id)}
                                                    disabled={retryVideo.isPending}
                                                    className="gap-1.5 shrink-0 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                >
                                                    <IconRefresh className="h-3.5 w-3.5" />
                                                    Retry
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Failed Clips */}
                <TabsContent value="clips" className="mt-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base">Failed Clips</CardTitle>
                                {data?.failedClips.length ? (
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={() => handleRetryAll("clips")}
                                        disabled={retryClip.isPending}
                                        className="gap-2"
                                    >
                                        <IconRefresh className="h-4 w-4" />
                                        Retry All ({data.failedClips.length})
                                    </Button>
                                ) : null}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                                </div>
                            ) : !data?.failedClips.length ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                                    <IconScissors className="h-10 w-10 opacity-30" />
                                    <p className="text-sm">No failed clips 🎉</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {data.failedClips.map((c) => (
                                        <div key={c.id} className="border border-red-200 dark:border-red-900 rounded-lg p-3 bg-red-50/30 dark:bg-red-950/10">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="font-medium text-sm truncate">{c.title || "Untitled clip"}</span>
                                                    </div>
                                                    {c.videoTitle && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                                            <IconVideo className="h-3 w-3 shrink-0" />
                                                            from: <span className="truncate">{c.videoTitle}</span>
                                                        </p>
                                                    )}
                                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                                        {c.userName && (
                                                            <Link href={`/admin/users/${c.userId}`} className="flex items-center gap-1 hover:text-foreground transition-colors">
                                                                <IconUser className="h-3 w-3" /> {c.userName}
                                                            </Link>
                                                        )}
                                                        {c.workspaceName && (
                                                            <span className="flex items-center gap-1">
                                                                <IconBuildingStore className="h-3 w-3" /> {c.workspaceName}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <IconClock className="h-3 w-3" />
                                                            {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleRetryClip(c.id)}
                                                    disabled={retryClip.isPending}
                                                    className="gap-1.5 shrink-0 border-red-300 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                >
                                                    <IconRefresh className="h-3.5 w-3.5" />
                                                    Retry
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Pagination */}
                            {data && Math.ceil(data.totalFailedClips / 50) > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <span className="text-sm text-muted-foreground">Page {page}</span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                            <IconChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={data.failedClips.length < 50}>
                                            <IconChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
