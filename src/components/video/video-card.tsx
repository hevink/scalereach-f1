"use client";

import { VideoLite } from "@/lib/api/video";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    IconFile,
    IconLoader2,
    IconClock,
    IconDots,
} from "@tabler/icons-react";

interface VideoCardProps {
    video: VideoLite;
    onClick?: () => void;
    onMenuClick?: (e: React.MouseEvent) => void;
    className?: string;
    workspaceSlug?: string;
}

/**
 * VideoCard component displays a video thumbnail with metadata
 * Includes hover effects, processing status, and responsive design
 * 
 * @validates Requirements 1.2, 1.4 - Video card display with responsive design
 */
export function VideoCard({
    video,
    onClick,
    onMenuClick,
    className,
}: VideoCardProps) {
    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    const getStatusBadge = () => {
        const processingStatuses = ["downloading", "uploading", "transcribing", "analyzing"];

        if (processingStatuses.includes(video.status)) {
            return (
                <Badge variant="secondary" className="text-xs gap-1">
                    <IconLoader2 className="size-3 animate-spin" />
                    Processing
                </Badge>
            );
        }

        if (video.status === "failed") {
            return <Badge variant="destructive" className="text-xs">Failed</Badge>;
        }

        return null;
    };

    const getThumbnailUrl = () => {
        if (video.sourceType === "youtube" && video.sourceUrl) {
            const videoIdMatch = video.sourceUrl.match(/[a-zA-Z0-9_-]{11}/);
            if (videoIdMatch) {
                return `https://img.youtube.com/vi/${videoIdMatch[0]}/mqdefault.jpg`;
            }
        }
        return null;
    };

    const thumbnailUrl = getThumbnailUrl();

    return (
        <div
            data-testid="video-card"
            className={cn(
                "group relative cursor-pointer",
                "transition-transform duration-200 ease-out",
                "hover:scale-[1.02] hover:z-10",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg",
                className
            )}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick?.();
                }
            }}
            role="button"
            tabIndex={0}
            aria-label={`View clips for ${video.title?.trim() || "Untitled Video"}`}
        >
            {/* Video thumbnail with aspect ratio preservation */}
            {/* @validates Requirement 1.4 - Aspect ratio maintenance */}
            <div className="aspect-video bg-muted rounded-lg overflow-hidden relative shadow-sm group-hover:shadow-md transition-shadow">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={video.title || "Video thumbnail"}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                        <IconFile className="size-6 sm:size-8 text-muted-foreground opacity-50" />
                    </div>
                )}

                {/* Processing status badge */}
                {/* @validates Requirement 1.2 - Processing status display */}
                <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2">
                    {getStatusBadge()}
                </div>

                {/* Duration overlay */}
                {/* @validates Requirement 1.2 - Duration display */}
                {video.duration && (
                    <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 bg-black/70 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded backdrop-blur-sm">
                        {formatDuration(video.duration)}
                    </div>
                )}

                {/* Expiry indicator (7 days) */}
                <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 bg-black/70 text-white text-xs px-1 sm:px-1.5 py-0.5 rounded flex items-center gap-1 backdrop-blur-sm">
                    <IconClock className="size-3" />
                    7 days
                </div>

                {/* Hover overlay effect */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
            </div>

            {/* Video metadata */}
            {/* @validates Requirement 1.2 - Title display */}
            <div className="mt-1.5 sm:mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {video.title?.trim() || "Untitled Video"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                        {video.sourceType}
                    </p>
                </div>

                {/* Menu button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "size-6 shrink-0 transition-opacity",
                        "opacity-0 group-hover:opacity-100",
                        "focus:opacity-100"
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        onMenuClick?.(e);
                    }}
                    aria-label="Video options"
                >
                    <IconDots className="size-4" />
                </Button>
            </div>
        </div>
    );
}
