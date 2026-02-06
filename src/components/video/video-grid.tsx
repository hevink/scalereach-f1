"use client";

import { VideoLite } from "@/lib/api/video";
import { VideoCard } from "./video-card";
import { SkeletonVideoGrid } from "@/components/ui/skeletons";
import { IconVideo, IconUpload } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

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
 * VideoGrid component displays videos in a list layout
 * 
 * Features:
 * - List layout with table-like structure
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
                "rounded-2xl border-2 border-dashed bg-muted/30",
                className
            )}>
                {/* Illustration */}
                <div className="relative mb-6">
                    <div className="flex size-20 items-center justify-center rounded-2xl bg-muted">
                        <IconVideo className="size-10 text-muted-foreground" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 flex size-8 items-center justify-center rounded-full bg-primary/10 border-2 border-background">
                        <IconUpload className="size-4 text-primary" />
                    </div>
                </div>

                {/* Text */}
                <h3 className="text-lg font-semibold mb-2">
                    No videos yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                    Upload your first video or paste a YouTube link above to start creating viral clips with AI.
                </p>

                {/* Features hint */}
                <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50">
                        <span className="size-1.5 rounded-full bg-primary" />
                        AI clip detection
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50">
                        <span className="size-1.5 rounded-full bg-primary" />
                        Auto captions
                    </span>
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/50">
                        <span className="size-1.5 rounded-full bg-primary" />
                        One-click export
                    </span>
                </div>
            </div>
        );
    }

    // Render video list
    return (
        <div
            data-testid="video-grid"
            className={cn("rounded-lg border overflow-hidden", className)}
            role="list"
            aria-label="Video list"
        >
            {/* Column Headers */}
            <div className="grid grid-cols-[80px_1fr_140px_140px_100px_100px] gap-6 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b">
                <div>Thumbnail</div>
                <div>Description</div>
                <div className="hidden sm:block text-center">Source</div>
                <div className="hidden md:block text-center">Video type</div>
                <div className="hidden lg:block text-center">Ratio</div>
                <div className="text-right">Actions</div>
            </div>

            {/* Video Rows */}
            <div className="divide-y">
                {videos.map((video) => (
                    <div
                        key={video.id}
                        role="listitem"
                    >
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
        </div>
    );
}
