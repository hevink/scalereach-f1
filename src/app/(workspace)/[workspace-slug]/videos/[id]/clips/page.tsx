"use client";

import { use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconVideo,
    IconLoader2,
    IconFlame,
    IconClock,
    IconHeartFilled,
    IconScissors,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ClipDetailModal, useClipModalUrlState } from "@/components/clips/clip-detail-modal";
import { useVideo } from "@/hooks/useVideo";
import { useClipsByVideo } from "@/hooks/useClips";
import { cn } from "@/lib/utils";
import type { ClipResponse } from "@/lib/api/clips";

interface VideoClipsPageProps {
    params: Promise<{ "workspace-slug": string; id: string }>;
}

function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getScoreColor(score: number): string {
    if (score >= 70) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (score >= 40) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    return "bg-red-500/10 text-red-600 dark:text-red-400";
}

function VideoClipsLoading() {
    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex flex-col gap-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-video rounded-lg" />
                ))}
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
    isProcessing: boolean;
}

function NoClips({ videoTitle, isProcessing }: NoClipsProps) {
    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Processing Video</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Clips are being generated for &quot;{videoTitle}&quot;. This may take a few minutes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
            <IconVideo className="size-8 text-muted-foreground" />
            <div className="text-center">
                <h3 className="font-medium">No Clips Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    No clips have been generated for this video yet.
                </p>
            </div>
        </div>
    );
}

interface ClipCardProps {
    clip: ClipResponse;
    onClick: () => void;
}

function ClipCard({ clip, onClick }: ClipCardProps) {
    const thumbnailUrl = clip.storageUrl || clip.thumbnailUrl;
    const scoreColorClass = getScoreColor(clip.viralityScore);

    return (
        <Card
            className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/20"
            onClick={onClick}
        >
            {/* Thumbnail */}
            <div className="relative aspect-video bg-muted">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={clip.title}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <IconScissors className="size-12 text-muted-foreground/30" />
                    </div>
                )}

                {/* Duration badge */}
                <div className="absolute right-2 bottom-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-white text-xs">
                    <IconClock className="size-3" />
                    {formatDuration(clip.duration)}
                </div>

                {/* Viral score badge */}
                <Badge
                    className={cn(
                        "absolute left-2 top-2 flex items-center gap-1",
                        scoreColorClass
                    )}
                >
                    <IconFlame className="size-3" />
                    {clip.viralityScore}
                </Badge>

                {/* Favorite indicator */}
                {clip.favorited && (
                    <div className="absolute right-2 top-2">
                        <IconHeartFilled className="size-5 text-red-500 drop-shadow-md" />
                    </div>
                )}
            </div>

            {/* Content */}
            <CardContent className="p-3">
                <h3 className="line-clamp-2 font-medium text-sm leading-tight">
                    {clip.title}
                </h3>

                {clip.viralityReason && (
                    <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
                        {clip.viralityReason}
                    </p>
                )}

                {clip.hooks.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {clip.hooks.slice(0, 2).map((hook, i) => (
                            <Badge key={i} variant="outline" className="text-[10px]">
                                {hook}
                            </Badge>
                        ))}
                        {clip.hooks.length > 2 && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                +{clip.hooks.length - 2}
                            </Badge>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function VideoClipsPage({ params }: VideoClipsPageProps) {
    const { "workspace-slug": slug, id: videoId } = use(params);
    const router = useRouter();

    const { selectedClipId, isOpen, openModal, closeModal } = useClipModalUrlState();

    const {
        data: video,
        isLoading: videoLoading,
        error: videoError,
    } = useVideo(videoId);

    const {
        data: clips,
        isLoading: clipsLoading,
        error: clipsError,
    } = useClipsByVideo(videoId);

    const handleBack = useCallback(() => {
        router.push(`/${slug}/videos/${videoId}`);
    }, [router, slug, videoId]);

    const handleClipSelect = useCallback(
        (clipId: string) => {
            openModal(clipId);
        },
        [openModal]
    );

    const handleEditClip = useCallback(
        (clipId: string) => {
            router.push(`/${slug}/clips/${clipId}`);
        },
        [router, slug]
    );

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

    const isProcessing = ["downloading", "uploading", "transcribing", "analyzing", "processing"].includes(
        video.status
    );

    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Go back to video"
                >
                    <IconArrowLeft className="size-5" />
                </Button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-lg font-semibold">
                        {video.title || "Untitled Video"} - Clips
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {clips?.length || 0} clip{(clips?.length || 0) !== 1 ? "s" : ""} generated
                    </p>
                </div>
            </div>

            {/* Clips Grid */}
            <div className="flex-1 overflow-auto p-4">
                {!clips || clips.length === 0 ? (
                    <NoClips
                        videoTitle={video.title || "this video"}
                        isProcessing={isProcessing}
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {clips.map((clip) => (
                            <ClipCard
                                key={clip.id}
                                clip={clip}
                                onClick={() => handleClipSelect(clip.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Clip Detail Modal */}
            <ClipDetailModal
                clipId={selectedClipId}
                isOpen={isOpen}
                onClose={closeModal}
                onEdit={handleEditClip}
            />
        </div>
    );
}
