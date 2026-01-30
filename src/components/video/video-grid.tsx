"use client";

import { VideoLite } from "@/lib/api/video";
import { VideoCard } from "./video-card";
import { SkeletonVideoGrid } from "@/components/ui/skeletons";
import { IconVideo, IconUpload } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface VideoGridProps {
    videos: VideoLite[];
    onVideoClick: (videoId: string) => void;
    onDeleteVideo?: (videoId: string) => void;
    onRenameVideo?: (videoId: string, newTitle: string) => void;
    onDuplicateVideo?: (videoId: string) => void;
    isLoading?: boolean;
    className?: string;
}

/**
 * VideoGrid component displays videos in a responsive grid layout
 * 
 * Features:
 * - Responsive CSS Grid with auto-fill columns
 * - Skeleton loading states
 * - Empty state handling with engaging CTA
 * - Video card menu options (delete, rename, duplicate)
 */
export function VideoGrid({
    videos,
    onVideoClick,
    onDeleteVideo,
    onRenameVideo,
    onDuplicateVideo,
    isLoading = false,
    className,
}: VideoGridProps) {
    // Show skeleton loading state
    if (isLoading) {
        return <SkeletonVideoGrid count={10} className={className} />;
    }

    // Show empty state when no videos
    if (videos.length === 0) {
        return (
            <div className={cn(
                "flex flex-col items-center justify-center py-16 px-4 text-center",
                "rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-900/50",
                className
            )}>
                {/* Illustration */}
                <div className="relative mb-6">
                    <div className="flex size-20 items-center justify-center rounded-2xl bg-zinc-800">
                        <IconVideo className="size-10 text-zinc-500" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-emerald-500/10 border-2 border-zinc-900">
                        <IconUpload className="size-4 text-emerald-500" />
                    </div>
                </div>

                {/* Text */}
                <h3 className="text-lg font-semibold text-white mb-2">
                    No videos yet
                </h3>
                <p className="text-sm text-zinc-400 max-w-sm mb-6">
                    Upload your first video or paste a YouTube link above to start creating viral clips with AI.
                </p>

                {/* Features hint */}
                <div className="flex flex-wrap justify-center gap-3 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        AI clip detection
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        Auto captions
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        One-click export
                    </span>
                </div>
            </div>
        );
    }

    // Render video grid
    return (
        <div
            data-testid="video-grid"
            className={cn(
                "grid gap-3 sm:gap-4",
                "grid-cols-1",
                "xs:grid-cols-2",
                "sm:grid-cols-2",
                "md:grid-cols-3",
                "lg:grid-cols-4",
                "xl:grid-cols-5",
                className
            )}
            role="list"
            aria-label="Video grid"
        >
            {videos.map((video) => (
                <div key={video.id} role="listitem">
                    <VideoCard
                        video={video}
                        onClick={() => onVideoClick(video.id)}
                        onDelete={onDeleteVideo}
                        onRename={onRenameVideo}
                        onDuplicate={onDuplicateVideo}
                    />
                </div>
            ))}
        </div>
    );
}
