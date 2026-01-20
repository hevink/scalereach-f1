"use client";

import { IconVideo, IconLoader2, IconCheck, IconX, IconTrash, IconClock, IconUpload } from "@tabler/icons-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useMyVideos, useDeleteVideo } from "@/hooks/useVideo";
import { toast } from "sonner";
import type { Video } from "@/lib/api/video";

function formatDuration(seconds: number | null): string {
    if (!seconds) return "--:--";
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

const STATUS_CONFIG: Record<Video["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
    pending: { label: "Pending", variant: "secondary", icon: <IconClock className="size-3" /> },
    downloading: { label: "Downloading", variant: "default", icon: <IconLoader2 className="size-3 animate-spin" /> },
    uploading: { label: "Uploading", variant: "default", icon: <IconLoader2 className="size-3 animate-spin" /> },
    transcribing: { label: "Transcribing", variant: "default", icon: <IconLoader2 className="size-3 animate-spin" /> },
    analyzing: { label: "Analyzing", variant: "default", icon: <IconLoader2 className="size-3 animate-spin" /> },
    completed: { label: "Completed", variant: "outline", icon: <IconCheck className="size-3" /> },
    failed: { label: "Failed", variant: "destructive", icon: <IconX className="size-3" /> },
};

/**
 * VideoItemSkeleton - Loading skeleton for video items
 * 
 * Matches the layout of VideoItem to prevent layout shift during loading.
 * Uses animate-pulse for subtle loading animation.
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 */
function VideoItemSkeleton() {
    return (
        <div className="flex items-center gap-4 rounded-lg border p-4" role="status" aria-label="Loading video">
            {/* Thumbnail skeleton */}
            <Skeleton className="h-16 w-28 shrink-0 rounded" />

            {/* Info skeleton */}
            <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/3 rounded" />
            </div>

            {/* Status badge skeleton */}
            <Skeleton className="h-5 w-20 shrink-0 rounded-full" />

            {/* Action button skeleton */}
            <Skeleton className="size-8 shrink-0 rounded" />
        </div>
    );
}

interface VideoItemProps {
    video: Video;
    onDelete: (id: string) => void;
    isDeleting: boolean;
}

function VideoItem({ video, onDelete, isDeleting }: VideoItemProps) {
    const statusConfig = STATUS_CONFIG[video.status];
    const metadata = video.metadata as { thumbnail?: string } | null;

    return (
        <div className="flex items-center gap-4 rounded-lg border p-4">
            {/* Thumbnail */}
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-muted">
                {metadata?.thumbnail ? (
                    <img
                        src={metadata.thumbnail}
                        alt={video.title || "Video thumbnail"}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <IconVideo className="size-6 text-muted-foreground" />
                    </div>
                )}
                {video.duration && (
                    <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-white text-xs">
                        {formatDuration(video.duration)}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                <h4 className="truncate font-medium text-sm">
                    {video.title || "Processing..."}
                </h4>
                <p className="text-muted-foreground text-xs">
                    {formatDate(video.createdAt)}
                </p>
                {video.errorMessage && (
                    <p className="truncate text-red-500 text-xs">{video.errorMessage}</p>
                )}
            </div>

            {/* Status */}
            <Badge variant={statusConfig.variant} className="flex items-center gap-1">
                {statusConfig.icon}
                {statusConfig.label}
            </Badge>

            {/* Actions */}
            <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(video.id)}
                disabled={isDeleting}
            >
                {isDeleting ? (
                    <IconLoader2 className="size-4 animate-spin" />
                ) : (
                    <IconTrash className="size-4" />
                )}
            </Button>
        </div>
    );
}

interface VideoListProps {
    onVideoClick?: (videoId: string) => void;
    /** Callback when upload button is clicked in empty state */
    onUploadClick?: () => void;
}

export function VideoList({ onVideoClick, onUploadClick }: VideoListProps) {
    const { data: videos, isLoading, error } = useMyVideos();
    const deleteMutation = useDeleteVideo();

    const handleDelete = async (id: string) => {
        try {
            await deleteMutation.mutateAsync(id);
            toast.success("Video deleted");
        } catch (error) {
            toast.error("Failed to delete video");
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Your Videos</CardTitle>
                    <CardDescription>Loading videos...</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Skeleton loading state - matches VideoItem layout to prevent layout shift */}
                    {/* @validates Requirements 29.1, 29.2, 29.3, 29.4 */}
                    <div className="space-y-3">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <VideoItemSkeleton key={`skeleton-${index}`} />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Your Videos</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground">
                        Failed to load videos. Please try again.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Your Videos</CardTitle>
                <CardDescription>
                    {videos?.length
                        ? `${videos.length} video${videos.length === 1 ? "" : "s"}`
                        : "No videos yet"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {videos && videos.length > 0 ? (
                    <div className="space-y-3">
                        {videos.map((video) => (
                            <VideoItem
                                key={video.id}
                                video={video}
                                onDelete={handleDelete}
                                isDeleting={deleteMutation.isPending && deleteMutation.variables === video.id}
                            />
                        ))}
                    </div>
                ) : (
                    /* Empty state for no videos - Requirement 28.2 */
                    <EmptyState
                        icon={<IconVideo className="size-6" />}
                        title="No videos yet"
                        description="Upload a video or paste a YouTube URL to get started with AI-powered clip detection."
                        action={onUploadClick ? {
                            label: "Upload Video",
                            onClick: onUploadClick,
                        } : undefined}
                    />
                )}
            </CardContent>
        </Card>
    );
}
