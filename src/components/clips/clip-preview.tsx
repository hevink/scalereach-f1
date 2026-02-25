"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { VideoPlayer, type VideoPlayerRef } from "@/components/video/video-player";
import { Badge } from "@/components/ui/badge";
import { FireIcon as FireAnimatedIcon } from "@/components/ui/fire-icon";
import {
    IconClock,
    IconHeart,
    IconHeartFilled,
} from "@tabler/icons-react";
import type { ClipResponse } from "@/lib/api/clips";

/**
 * Format duration in seconds to MM:SS format
 */
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get color class for virality score badge
 * Green for high (≥70), yellow for medium (40-69), red for low (<40)
 */
function getScoreColor(score: number): string {
    if (score >= 70) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (score >= 40) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    return "bg-red-500/10 text-red-600 dark:text-red-400";
}

/**
 * ClipPreviewProps interface
 * 
 * @validates Requirements 8.1, 8.2, 8.3
 */
export interface ClipPreviewProps {
    /** The viral clip to preview */
    clip: ClipResponse;
    /** Whether to auto-play the clip on mount */
    autoPlay?: boolean;
    /** Callback when playback time updates */
    onTimeUpdate?: (time: number) => void;
    /** Callback when clip playback ends */
    onEnded?: () => void;
    /** Whether to loop the clip playback */
    loop?: boolean;
    /** Whether to show clip metadata (title, score, etc.) */
    showMetadata?: boolean;
    /** Additional className */
    className?: string;
}

/**
 * ClipPreview Component
 * 
 * Embeds the VideoPlayer component to preview a viral clip segment.
 * Provides playback controls and supports autoplay option.
 * 
 * Features:
 * - Embeds VideoPlayer for clip segment playback (Requirement 8.1)
 * - Provides play/pause, seek, and volume controls (Requirement 8.2)
 * - Supports autoplay option (Requirement 8.3)
 * - Displays clip metadata (title, duration, virality score)
 * - Shows favorite status indicator
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ClipPreview clip={clip} />
 * 
 * // With autoplay
 * <ClipPreview clip={clip} autoPlay />
 * 
 * // With callbacks
 * <ClipPreview
 *   clip={clip}
 *   autoPlay
 *   onTimeUpdate={(time) => console.log('Current time:', time)}
 *   onEnded={() => console.log('Clip ended')}
 * />
 * ```
 * 
 * @validates Requirements 8.1, 8.2, 8.3
 */
export function ClipPreview({
    clip,
    autoPlay = false,
    onTimeUpdate,
    onEnded,
    loop = false,
    showMetadata = true,
    className,
}: ClipPreviewProps) {
    const playerRef = React.useRef<VideoPlayerRef>(null);

    // Get the video source URL - prefer storageUrl, fallback to thumbnailUrl for poster
    const videoSrc = clip.storageUrl || "";
    const posterUrl = clip.thumbnailUrl || clip.storageUrl || undefined;

    // If no video source is available, show a placeholder
    if (!videoSrc) {
        return (
            <div
                className={cn(
                    "flex flex-col overflow-hidden rounded-lg border bg-card",
                    className
                )}
                role="region"
                aria-label={`Clip preview: ${clip.title}`}
            >
                {/* Placeholder for missing video */}
                <div className="relative aspect-video w-full bg-muted flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                        <IconClock className="size-8 mx-auto mb-2" />
                        <p className="text-sm">Video not available</p>
                        <p className="text-xs">Clip is still being processed</p>
                    </div>
                </div>

                {/* Metadata section */}
                {showMetadata && (
                    <ClipMetadata clip={clip} />
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col overflow-hidden rounded-lg border bg-card",
                className
            )}
            role="region"
            aria-label={`Clip preview: ${clip.title}`}
        >
            {/* Video Player - Requirement 8.1, 8.2 */}
            <VideoPlayer
                ref={playerRef}
                src={videoSrc}
                poster={posterUrl}
                startTime={clip.startTime}
                endTime={clip.endTime}
                autoPlay={autoPlay}
                loop={loop}
                onTimeUpdate={onTimeUpdate}
                onEnded={onEnded}
                className="aspect-video w-full"
            />

            {/* Metadata section */}
            {showMetadata && (
                <ClipMetadata clip={clip} />
            )}
        </div>
    );
}

/**
 * ClipMetadata - Displays clip information below the video player
 */
interface ClipMetadataProps {
    clip: ClipResponse;
}

function ClipMetadata({ clip }: ClipMetadataProps) {
    const scoreColorClass = getScoreColor(clip.viralityScore);

    return (
        <div className="flex flex-col gap-2 p-4">
            {/* Title and favorite indicator */}
            <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm leading-tight line-clamp-2">
                    {clip.title}
                </h3>
                {clip.favorited && (
                    <IconHeartFilled className="size-4 shrink-0 text-red-500" aria-label="Favorited" />
                )}
            </div>

            {/* Score and duration badges */}
            <div className="flex items-center gap-2 flex-wrap">
                <Badge
                    variant="secondary"
                    className={cn("flex items-center gap-1", scoreColorClass)}
                >
                    <FireAnimatedIcon />
                    <span>{clip.viralityScore}</span>
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                    <IconClock className="size-3" />
                    <span>{formatDuration(clip.duration)}</span>
                </Badge>
                {clip.status !== "ready" && clip.status !== "exported" && (
                    <Badge variant="secondary" className="capitalize">
                        {clip.status}
                    </Badge>
                )}
            </div>

            {/* Virality reason */}
            {clip.viralityReason && (
                <p className="text-muted-foreground text-xs line-clamp-2">
                    {clip.viralityReason}
                </p>
            )}

            {/* Hooks and emotions */}
            {(clip.hooks.length > 0 || clip.emotions.length > 0) && (
                <div className="flex flex-wrap gap-1">
                    {clip.hooks.slice(0, 3).map((hook, i) => (
                        <Badge key={`hook-${i}`} variant="outline" className="text-xs">
                            {hook}
                        </Badge>
                    ))}
                    {clip.emotions.slice(0, 2).map((emotion, i) => (
                        <Badge key={`emotion-${i}`} variant="outline" className="text-xs">
                            {emotion}
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ClipPreview;
