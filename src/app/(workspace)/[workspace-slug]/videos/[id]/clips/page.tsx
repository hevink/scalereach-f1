"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconVideo,
    IconLoader2,
    IconClock,
    IconFile,
    IconAspectRatio,
    IconFlame,
    IconCalendar,
    IconLayoutRows,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useVideo, useVideoStatus } from "@/hooks/useVideo";
import { useClipsByVideo, useToggleFavorite } from "@/hooks/useClips";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useQuery } from "@tanstack/react-query";
import { videoConfigApi } from "@/lib/api/video-config";
import { analytics } from "@/lib/analytics";
import type { ClipResponse } from "@/lib/api/clips";
import { ShareManager } from "@/components/share/share-manager";
import { ClipCard } from "@/components/clips/clip-card";

interface VideoClipsPageProps {
    params: Promise<{ "workspace-slug": string; id: string }>;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function VideoClipsLoading() {
    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header Skeleton */}
            <div className="border-b px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Skeleton className="size-8 sm:size-9 rounded-md shrink-0 mt-0.5" />
                        <div>
                            <Skeleton className="h-6 sm:h-7 w-48 sm:w-96 mb-2" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 ml-10 sm:ml-11">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>
            </div>

            {/* Clips Skeleton */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center">
                <div className="space-y-6 max-w-4xl w-full">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card overflow-hidden">
                            {/* Title */}
                            <div className="px-5 py-3 border-b bg-muted/30">
                                <Skeleton className="h-5 w-64" />
                            </div>

                            {/* Content */}
                            <div className="p-4">
                                <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
                                    {/* Video Preview Skeleton */}
                                    <div className="shrink-0">
                                        <Skeleton className="w-full lg:w-[230px] h-[400px] rounded-lg" />
                                    </div>

                                    {/* Tabs Section Skeleton */}
                                    <div className="flex-1">
                                        <div className="flex gap-2 mb-3">
                                            <Skeleton className="h-9 w-28 rounded-md" />
                                            <Skeleton className="h-9 w-36 rounded-md" />
                                        </div>
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-4 w-full" />
                                            <Skeleton className="h-4 w-5/6" />
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons Skeleton */}
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-9 w-28" />
                                        <Skeleton className="h-9 w-40" />
                                        <Skeleton className="h-9 w-20" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="size-9 rounded-md" />
                                        <Skeleton className="size-9 rounded-md" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface VideoClipsErrorProps {
    error: Error | null;
    onBack: () => void;
}

function VideoClipsError({ error, onBack }: VideoClipsErrorProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="size-8 text-destructive" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Failed to load clips</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {error?.message || "An error occurred while loading the clips."}
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

interface VideoNotFoundProps {
    onBack: () => void;
}

function VideoNotFound({ onBack }: VideoNotFoundProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <IconVideo className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Video not found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    The video you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

interface NoClipsProps {
    videoTitle: string;
    videoStatus: string;
    videoCreatedAt: string;
}

function NoClips({ videoTitle, videoStatus, videoCreatedAt }: NoClipsProps) {
    // Calculate time elapsed since video creation (in minutes)
    const timeElapsedMinutes = (Date.now() - new Date(videoCreatedAt).getTime()) / (1000 * 60);

    // If video has been processing for more than 5 minutes and still no clips, show "No Clips Found"
    const hasTimedOut = timeElapsedMinutes > 5;

    if (videoStatus === "downloading" && !hasTimedOut) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Downloading Video</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Downloading &quot;{videoTitle}&quot; from YouTube...
                    </p>
                </div>
            </div>
        );
    }

    if (videoStatus === "uploading" && !hasTimedOut) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Uploading Video</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Uploading video to storage...
                    </p>
                </div>
            </div>
        );
    }

    if (videoStatus === "transcribing" && !hasTimedOut) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Transcribing Audio</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Converting speech to text for &quot;{videoTitle}&quot;...
                    </p>
                </div>
            </div>
        );
    }

    if ((videoStatus === "analyzing" || videoStatus === "processing") && !hasTimedOut) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Detecting Viral Clips</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        AI is analyzing &quot;{videoTitle}&quot; for viral moments. This may take a few minutes.
                    </p>
                </div>
            </div>
        );
    }

    if (videoStatus === "failed" || videoStatus === "error") {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-8">
                <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                    <IconAlertCircle className="size-6 text-destructive" />
                </div>
                <div className="text-center max-w-md">
                    <h3 className="font-medium text-destructive">Something went wrong</h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                        We couldn&apos;t process this video. Please try again or use a different video.
                    </p>
                </div>
            </div>
        );
    }

    if (videoStatus === "pending" && !hasTimedOut) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconClock className="size-8 text-muted-foreground" />
                <div className="text-center">
                    <h3 className="font-medium">Queued for Processing</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        &quot;{videoTitle}&quot; is waiting in the queue. Processing will start soon.
                    </p>
                </div>
            </div>
        );
    }

    // Default: Show "No Clips Found" for completed videos or timed-out processing
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
            <IconVideo className="size-8 text-muted-foreground" />
            <div className="text-center">
                <h3 className="font-medium">No Clips Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    No viral clips were detected in this video. Try a video with more engaging content.
                </p>
            </div>
        </div>
    );
}

export default function VideoClipsPage({ params }: VideoClipsPageProps) {
    const { "workspace-slug": slug, id: videoId } = use(params);
    const router = useRouter();

    const {
        data: video,
        isLoading: videoLoading,
        error: videoError,
        refetch: refetchVideo,
    } = useVideo(videoId);

    const {
        data: clips,
        isLoading: clipsLoading,
        error: clipsError,
        refetch: refetchClips,
    } = useClipsByVideo(videoId);

    const isProcessing = !!video?.status && !["completed", "failed", "error"].includes(video.status);

    // Adaptive polling for video status during processing
    const { data: statusData } = useVideoStatus(videoId, isProcessing);

    // When status polling detects a change, refetch video and clips
    useEffect(() => {
        if (!statusData?.video) return;
        const polledStatus = statusData.video.status;
        if (polledStatus !== video?.status) {
            refetchVideo();
            refetchClips();
        }
    }, [statusData, video?.status, refetchVideo, refetchClips]);

    const {
        data: workspace,
    } = useWorkspaceBySlug(slug);

    const {
        data: configData,
    } = useQuery({
        queryKey: ["video-config", videoId],
        queryFn: () => videoConfigApi.getConfig(videoId),
        enabled: !!videoId,
    });

    const toggleFavorite = useToggleFavorite();

    const handleBack = useCallback(() => {
        router.push(`/${slug}`);
    }, [router, slug]);

    const handleEditClip = useCallback(
        (clipId: string) => {
            router.push(`/${slug}/clips/${clipId}`);
        },
        [router, slug]
    );

    const handleFavorite = useCallback(
        (e: React.MouseEvent, clipId: string) => {
            e.stopPropagation();
            toggleFavorite.mutate(clipId);
        },
        [toggleFavorite]
    );

    const handleDownload = useCallback((clip: ClipResponse) => {
        if (clip.storageUrl) {
            analytics.clipDownloaded(clip.id);
            const link = document.createElement("a");
            link.href = clip.storageUrl;
            link.download = `${clip.title || "clip"}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, []);

    const handleShare = useCallback((clip: ClipResponse) => {
        if (navigator.share && clip.storageUrl) {
            navigator.share({
                title: clip.title,
                url: clip.storageUrl,
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(clip.storageUrl || "");
        }
    }, []);

    if (videoLoading || clipsLoading) {
        return <VideoClipsLoading />;
    }

    if (videoError || clipsError) {
        return (
            <VideoClipsError
                error={(videoError || clipsError) as Error}
                onBack={handleBack}
            />
        );
    }

    if (!video) {
        return <VideoNotFound onBack={handleBack} />;
    }

    // Derive metadata for tags
    const sourceType = video.sourceType === "youtube" ? "YouTube" : "Local file";
    const aspectRatio = configData?.config?.aspectRatio || "9:16";
    const hasSplitScreen = configData?.config?.enableSplitScreen || false;

    return (
        <div className="flex h-full flex-col bg-background">
            {/* Header */}
            <div className="border-b px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleBack}
                            className="mt-0.5 shrink-0 size-8 sm:size-9"
                            aria-label="Go back"
                        >
                            <IconArrowLeft className="size-4 sm:size-5" />
                        </Button>
                        <div className="min-w-0">
                            <h1 className="text-base sm:text-xl font-semibold truncate">
                                {video.title || "Untitled Video"}
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                {formatDate(video.createdAt)}
                            </p>
                        </div>
                    </div>

                    {/* Share Button */}
                    {workspace && (
                        <div className="shrink-0">
                            <ShareManager
                                videoId={videoId}
                                workspaceSlug={slug}
                                clipCount={clips?.length || 0}
                                userPlan={workspace.plan as "free" | "starter" | "pro"}
                            />
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 ml-10 sm:ml-11">
                    <Badge variant="outline" className="gap-1.5 text-[11px] sm:text-xs">
                        <IconFile className="size-3" />
                        {sourceType}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5 text-[11px] sm:text-xs">
                        <IconAspectRatio className="size-3" />
                        {aspectRatio}
                    </Badge>
                    {hasSplitScreen && (
                        <Badge variant="outline" className="gap-1.5 text-[11px] sm:text-xs text-primary border-primary/30 bg-primary/5">
                            <IconLayoutRows className="size-3" />
                            Split Screen
                        </Badge>
                    )}
                    <Badge variant="outline" className="gap-1.5 text-[11px] sm:text-xs">
                        <IconFlame className="size-3" />
                        Viral Clips
                    </Badge>
                    {video.createdAt && (
                        <Badge variant="outline" className="gap-1.5 text-[11px] sm:text-xs text-primary border-primary/30">
                            <IconCalendar className="size-3" />
                            Expires: {formatDate(new Date(new Date(video.createdAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Clips List */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex flex-col justify-center items-center">
                {!clips || clips.length === 0 ? (
                    <NoClips
                        videoTitle={video.title || "this video"}
                        videoStatus={video.status}
                        videoCreatedAt={video.createdAt}
                    />
                ) : (
                    <div className="space-y-6 max-w-4xl">
                        {clips.map((clip, index) => (
                            <ClipCard
                                key={clip.id}
                                clip={clip}
                                index={index}
                                onEdit={handleEditClip}
                                onFavorite={handleFavorite}
                                onDownload={handleDownload}
                                onShare={handleShare}
                                userPlan={(workspace?.plan as "free" | "starter" | "pro" | "agency") || "free"}
                                workspaceSlug={slug}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
