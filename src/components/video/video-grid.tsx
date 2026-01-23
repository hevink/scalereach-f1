"use client";

import { VideoLite } from "@/lib/api/video";
import { VideoCard } from "./video-card";
import { SkeletonVideoGrid } from "@/components/ui/skeletons";
import { IconVideo } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface VideoGridProps {
    videos: VideoLite[];
    onVideoClick: (videoId: string) => void;
    isLoading?: boolean;
    className?: string;
}

/**
 * VideoGrid component displays videos in a responsive grid layout
 * 
 * Features:
 * - Responsive CSS Grid with auto-fill columns
 * - Skeleton loading states
 * - Empty state handling
 * - 1 column (mobile), 2 columns (tablet), 3-5 columns (desktop)
 * 
 * @validates Requirements 1.1, 1.5 - Video grid display with responsive layout
 */
export function VideoGrid({
    videos,
    onVideoClick,
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
            <div className={cn("text-center py-8 sm:py-12 text-muted-foreground", className)}>
                <IconVideo className="size-10 sm:size-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="font-medium text-sm sm:text-base">No videos yet</p>
                <p className="text-xs sm:text-sm">Upload a video to get started!</p>
            </div>
        );
    }

    // Render video grid
    // @validates Requirement 1.1 - Display all videos in responsive grid
    // @validates Requirement 1.5 - Skeleton loading states prevent layout shift
    return (
        <div
            data-testid="video-grid"
            className={cn(
                // Responsive grid with auto-fill
                // Mobile: 1 column (default, < 640px)
                // Tablet: 2 columns (sm, 640px+)
                // Desktop: 3-5 columns based on screen width (md: 768px+, lg: 1024px+, xl: 1280px+)
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
                    />
                </div>
            ))}
        </div>
    );
}
