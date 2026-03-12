"use client";

import { use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconVideo,
    IconLoader2,
    IconClock,
    IconUpload,
    IconAspectRatio,
    IconCalendar,
    IconLayoutRows,
} from "@tabler/icons-react";
import { FireIcon as FireAnimatedIcon } from "@/components/ui/fire-icon";
import { motion } from "framer-motion";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useVideo, useVideoStatus } from "@/hooks/useVideo";
import { useClipsByVideo, useToggleFavorite } from "@/hooks/useClips";
import { useWorkspaceBySlug } from "@/hooks/useWorkspace";
import { useQuery } from "@tanstack/react-query";
import { videoConfigApi } from "@/lib/api/video-config";
import { analytics } from "@/lib/analytics";
import type { ClipResponse } from "@/lib/api/clips";
import { clipsApi } from "@/lib/api/clips";
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

            {/* Clips Skeleton - staggered fade-in */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 flex justify-center">
                <div className="space-y-6 max-w-4xl w-full">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-xl border bg-card overflow-hidden animate-pulse"
                            style={{ animationDelay: `${i * 150}ms` }}
                        >
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
    thumbnailUrl?: string | null;
}

const PROCESSING_STEPS = [
    { key: "downloading", label: "Downloading video from source" },
    { key: "uploading", label: "Uploading video to storage" },
    { key: "transcribing", label: "Converting speech to text" },
    { key: "analyzing", label: "Detecting viral clips with AI" },
] as const;

function getActiveStepIndex(status: string): number {
    const map: Record<string, number> = { downloading: 0, uploading: 1, transcribing: 2, analyzing: 3, processing: 3 };
    return map[status] ?? -1;
}

function CheckFilledIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
        </svg>
    );
}

function CheckOutlineIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
            <path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
    );
}

function ProcessingCard({ title, description, thumbnailUrl, step }: {
    title: string;
    description: string;
    thumbnailUrl?: string | null;
    step: number;
    icon?: React.ReactNode;
    totalSteps?: number;
}) {
    const progress = Math.max(0, Math.min(((step + 0.5) / 4) * 100, 99));

    return (
        <div className="w-full max-w-lg mx-auto">
            <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
                {/* Thumbnail */}
                {thumbnailUrl && (
                    <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        <Image
                            src={thumbnailUrl}
                            alt="Video thumbnail"
                            fill
                            className="object-cover opacity-80"
                            unoptimized
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-card via-card/40 to-transparent" />
                    </div>
                )}

                {/* Content */}
                <div className="p-5 space-y-4">
                    <div className="text-center">
                        <h3 className="font-semibold text-base">{title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                    </div>

                    {/* Animated step list */}
                    <div className="flex flex-col gap-3 px-2">
                        {PROCESSING_STEPS.map((s, i) => {
                            const isCompleted = i < step;
                            const isActive = i === step;
                            const isFuture = i > step;
                            return (
                                <motion.div
                                    key={s.key}
                                    className="flex items-center gap-3"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{
                                        opacity: isFuture ? 0.35 : 1,
                                        x: 0,
                                    }}
                                    transition={{ duration: 0.4, delay: i * 0.08 }}
                                >
                                    {isCompleted ? (
                                        <motion.div
                                            initial={{ scale: 0.5 }}
                                            animate={{ scale: 1 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        >
                                            <CheckFilledIcon className="size-6 text-primary shrink-0" />
                                        </motion.div>
                                    ) : isActive ? (
                                        <motion.div
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                                            className="shrink-0"
                                        >
                                            <IconLoader2 className="size-6 text-primary" />
                                        </motion.div>
                                    ) : (
                                        <CheckOutlineIcon className="size-6 text-muted-foreground/40 shrink-0" />
                                    )}
                                    <span className={`text-sm ${isActive ? "text-primary font-medium" : isCompleted ? "text-foreground" : "text-muted-foreground/40"
                                        }`}>
                                        {s.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Progress bar */}
                    <div className="space-y-1.5">
                        <Progress value={progress} className="h-1.5" />
                        <p className="text-xs text-muted-foreground text-center">
                            Step {step + 1} of 4
                        </p>
                    </div>

                    {/* Reassurance */}
                    <p className="text-[11px] text-muted-foreground/70 text-center">
                        You can leave this page - we&apos;ll notify you when it&apos;s done.
                    </p>
                </div>
            </div>
        </div>
    );
}

function FailedClipsBanner({ failedClips, onRetryComplete }: { failedClips: ClipResponse[]; onRetryComplete: () => void }) {
    const [isRetrying, setIsRetrying] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    const handleRetryAll = async () => {
        setIsRetrying(true);
        setRetryCount(0);
        for (const clip of failedClips) {
            try {
                await clipsApi.regenerateClip(clip.id);
                setRetryCount(prev => prev + 1);
                // Stagger retries by 2s to avoid hitting YouTube rate limits again
                if (clip !== failedClips[failedClips.length - 1]) {
                    await new Promise(r => setTimeout(r, 2000));
                }
            } catch {
                // Continue with next clip even if one fails
            }
        }
        setIsRetrying(false);
        onRetryComplete();
    };

    const isYouTubeError = failedClips.some(c => c.errorMessage?.includes("Sign in to confirm") || c.errorMessage?.includes("yt-dlp"));

    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
            <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                    <IconAlertCircle className="size-4 text-destructive" />
                </div>
                <div>
                    <p className="text-sm text-foreground">
                        {failedClips.length} clip{failedClips.length > 1 ? "s" : ""} failed to generate.
                    </p>
                    {isYouTubeError && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                            YouTube temporarily blocked some downloads. Retrying with delays usually fixes this.
                        </p>
                    )}
                </div>
            </div>
            <Button
                size="sm"
                variant="outline"
                className="shrink-0 gap-1.5 w-full sm:w-auto border-destructive/30 hover:bg-destructive/10"
                onClick={handleRetryAll}
                disabled={isRetrying}
            >
                {isRetrying ? (
                    <>
                        <IconLoader2 className="size-3.5 animate-spin" />
                        Retrying {retryCount}/{failedClips.length}...
                    </>
                ) : (
                    <>
                        <IconAlertCircle className="size-3.5" />
                        Retry all failed
                    </>
                )}
            </Button>
        </div>
    );
}

function NoClips({ videoTitle, videoStatus, videoCreatedAt, thumbnailUrl }: NoClipsProps) {
    const timeElapsedMinutes = (Date.now() - new Date(videoCreatedAt).getTime()) / (1000 * 60);
    const hasTimedOut = timeElapsedMinutes > 15;

    const stepIndex = getActiveStepIndex(videoStatus);

    const STEP_TITLES: Record<string, { title: string; description: string }> = {
        downloading: { title: "Downloading Video", description: `Fetching "${videoTitle}" from YouTube...` },
        uploading: { title: "Uploading Video", description: "Uploading video to storage..." },
        transcribing: { title: "Transcribing Audio", description: `Converting speech to text for "${videoTitle}"...` },
        analyzing: { title: "Detecting Viral Clips", description: `AI is analyzing "${videoTitle}" for viral moments. This may take a few minutes.` },
        processing: { title: "Detecting Viral Clips", description: `AI is analyzing "${videoTitle}" for viral moments. This may take a few minutes.` },
    };

    // Active processing states
    if (stepIndex >= 0 && !hasTimedOut) {
        const meta = STEP_TITLES[videoStatus] || STEP_TITLES.analyzing;
        return (
            <ProcessingCard
                title={meta.title}
                description={meta.description}
                thumbnailUrl={thumbnailUrl}
                step={stepIndex}
            />
        );
    }

    // Pending / queued
    if (videoStatus === "pending" && !hasTimedOut) {
        return (
            <div className="w-full max-w-lg mx-auto">
                <div className="overflow-hidden rounded-xl border bg-card shadow-sm p-6 text-center space-y-3">
                    <div className="flex justify-center">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <IconClock className="size-6 text-muted-foreground animate-pulse" />
                        </div>
                    </div>
                    <h3 className="font-semibold text-base">Queued for Processing</h3>
                    <p className="text-sm text-muted-foreground">
                        &ldquo;{videoTitle}&rdquo; is waiting in the queue. Processing will start soon.
                    </p>
                    <div className="flex justify-center pt-1">
                        <div className="flex gap-1">
                            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                            <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground/70">
                        You can leave this page - we&apos;ll notify you when it&apos;s done.
                    </p>
                </div>
            </div>
        );
    }

    // Failed / error
    if (videoStatus === "failed" || videoStatus === "error") {
        return (
            <div className="w-full max-w-md mx-auto">
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-8">
                    <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                        <IconAlertCircle className="size-6 text-destructive" />
                    </div>
                    <div className="text-center max-w-sm">
                        <h3 className="font-medium text-destructive">Something went wrong</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            We couldn&apos;t process this video. Please try again or use a different video.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Truly no clips
    return (
        <div className="w-full max-w-md mx-auto">
            <div className="flex flex-col items-center justify-center gap-4 rounded-xl border bg-muted/30 p-8">
                <IconVideo className="size-8 text-muted-foreground" />
                <div className="text-center">
                    <h3 className="font-medium">No Clips Found</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        No viral clips were detected in this video. Try a video with more engaging content.
                    </p>
                </div>
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

    const handleDownload = useCallback(async (clip: ClipResponse) => {
        if (clip.storageUrl) {
            analytics.clipDownloaded(clip.id);
            try {
                const response = await fetch(clip.storageUrl);
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `${clip.title || "clip"}.mp4`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            } catch {
                window.open(clip.storageUrl, "_blank");
            }
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

    // Video just completed but clips haven't loaded yet - show a nice transition
    const isWaitingForClips = video?.status === "completed" && (!clips || clips.length === 0);

    if (videoLoading || clipsLoading) {
        return <VideoClipsLoading />;
    }

    if (isWaitingForClips) {
        return (
            <div className="flex h-full flex-col bg-background">
                {/* Real header while waiting */}
                <div className="border-b px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                        <Skeleton className="size-8 sm:size-9 rounded-md shrink-0 mt-0.5" />
                        <div>
                            <h1 className="text-base sm:text-xl font-semibold truncate">
                                {video?.title || "Loading..."}
                            </h1>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                                {video?.createdAt ? formatDate(video.createdAt) : ""}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-6">
                    <div className="text-center space-y-4">
                        <div className="flex justify-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
                                <IconLoader2 className="size-7 animate-spin text-primary" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-base">Almost there...</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Loading your clips. This will only take a moment.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
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
                        {video.sourceType === "youtube" ? (
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 180" className="size-3" aria-hidden="true">
                                <path fill="red" d="M250.346 28.075A32.18 32.18 0 0 0 227.69 5.418C207.824 0 127.87 0 127.87 0S47.912.164 28.046 5.582A32.18 32.18 0 0 0 5.39 28.24c-6.009 35.298-8.34 89.084.165 122.97a32.18 32.18 0 0 0 22.656 22.657c19.866 5.418 99.822 5.418 99.822 5.418s79.955 0 99.82-5.418a32.18 32.18 0 0 0 22.657-22.657c6.338-35.348 8.291-89.1-.164-123.134Z" />
                                <path fill="#FFF" d="m102.421 128.06 66.328-38.418-66.328-38.418z" />
                            </svg>
                        ) : (
                            <IconUpload className="size-3" />
                        )}
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
                        <FireAnimatedIcon />
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
            <div className={`flex-1 overflow-auto p-4 sm:p-6 flex flex-col ${(!clips || clips.length === 0) ? "justify-center items-center" : "items-center"}`}>
                {!clips || clips.length === 0 ? (
                    <NoClips
                        videoTitle={video.title || "this video"}
                        videoStatus={video.status}
                        videoCreatedAt={video.createdAt}
                        thumbnailUrl={video.thumbnailUrl || (video.metadata?.thumbnail as string) || null}
                    />
                ) : (
                    <div className="space-y-6 max-w-4xl w-full">
                        {/* Clips still generating banner */}
                        {clips.some(c => c.status === "generating" || c.status === "detected") && (
                            <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                                <IconLoader2 className="size-4 shrink-0 animate-spin text-amber-500" />
                                <p className="text-sm text-foreground">
                                    Some clips are still being generated. This page will update automatically.
                                </p>
                            </div>
                        )}

                        {/* Failed clips banner */}
                        {clips.some(c => c.status === "failed") && (
                            <FailedClipsBanner
                                failedClips={clips.filter(c => c.status === "failed")}
                                onRetryComplete={refetchClips}
                            />
                        )}

                        {/* Schedule nudge - only shown when ALL clips are ready (none generating) */}
                        {!clips.some(c => c.status === "generating" || c.status === "detected") && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        <IconCalendar className="size-4 text-primary" />
                                    </div>
                                    <p className="text-sm text-foreground">
                                        Your clips are ready - schedule them to TikTok, Instagram, YouTube Shorts & more.
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => router.push(`/${slug}/social`)}
                                    className="shrink-0 rounded-full w-full sm:w-auto"
                                >
                                    Schedule now
                                </Button>
                            </div>
                        )}

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
                                workspaceId={workspace?.id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
