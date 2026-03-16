"use client";

import { useState, useCallback, useMemo } from "react";
import type React from "react";
import { VideoLite } from "@/lib/api/video";
import { VideoCard } from "./video-card";
import { VideoGridCard } from "./video-grid-card";
import { SkeletonVideoGrid } from "@/components/ui/skeletons";
import { IconUpload, IconList, IconLayoutGrid, IconSearch, IconX } from "@tabler/icons-react";
import { HugeVideoIcon } from "@/components/icons/huge-icons";
import { cn } from "@/lib/utils";
import { DEMO_VIDEOS } from "@/lib/demo-video";

interface VideoGridProps {
    videos: VideoLite[];
    onVideoClick: (videoId: string) => void;
    onDeleteVideo?: (videoId: string) => void;
    onRenameVideo?: (videoId: string, newTitle: string) => void;
    onDuplicateVideo?: (videoId: string) => void;
    isLoading?: boolean;
    className?: string;
    headerSlot?: React.ReactNode;
}

export function VideoGrid({
    videos,
    onVideoClick,
    onDeleteVideo,
    onRenameVideo,
    onDuplicateVideo,
    isLoading = false,
    className,
    headerSlot,
}: VideoGridProps) {
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
    const [viewMode, setViewMode] = useState<"list" | "grid">(() => {
        if (typeof window !== "undefined") {
            try {
                const saved = window.localStorage.getItem("video-view-mode");
                if (saved === "list" || saved === "grid") return saved;
            } catch {
                // Ignore unavailable storage in tests or privacy-restricted contexts.
            }
        }
        return "list";
    });
    const [searchQuery, setSearchQuery] = useState("");

    const filteredVideos = useMemo(() => {
        if (!searchQuery.trim()) return videos;
        const q = searchQuery.toLowerCase().trim();
        return videos.filter(v => v.title?.toLowerCase().includes(q));
    }, [videos, searchQuery]);

    const handleViewModeChange = useCallback((mode: "list" | "grid") => {
        setViewMode(mode);

        try {
            window.localStorage.setItem("video-view-mode", mode);
        } catch {
            // Keep the UI working even when storage persistence is unavailable.
        }
    }, []);

    const handleDelete = useCallback(async (videoId: string) => {
        if (!onDeleteVideo) return;
        setDeletingIds((prev) => new Set(prev).add(videoId));
        try {
            await onDeleteVideo(videoId);
        } finally {
            setDeletingIds((prev) => {
                const next = new Set(prev);
                next.delete(videoId);
                return next;
            });
        }
    }, [onDeleteVideo]);

    if (isLoading) {
        return <SkeletonVideoGrid count={10} className={className} viewMode={viewMode} />;
    }

    if (videos.length === 0) {
        return (
            <DemoVideoSection onVideoClick={onVideoClick} className={className} />
        );
    }

    return (
        <div className={cn("space-y-3", className)}>
            {/* Header row: title slot + view toggle */}
            <div className="flex items-center justify-between">
                {headerSlot ?? <div />}
                <div className="inline-flex rounded-lg border bg-muted/40 p-0.5 gap-0.5">
                    <button
                        onClick={() => handleViewModeChange("list")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                            viewMode === "list"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <IconList className="size-3.5" />
                        List
                    </button>
                    <button
                        onClick={() => handleViewModeChange("grid")}
                        className={cn(
                            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                            viewMode === "grid"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <IconLayoutGrid className="size-3.5" />
                        Grid
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search videos..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-8 w-80 rounded-md border bg-muted/30 pl-8 pr-8 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <IconX className="size-3" />
                        </button>
                    )}
                </div>
                {searchQuery.trim() && (
                    <span className="text-xs text-muted-foreground">
                        {filteredVideos.length} of {videos.length}
                    </span>
                )}
            </div>

            {/* Empty state for search */}
            {filteredVideos.length === 0 && videos.length > 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    <IconSearch className="size-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No videos match "{searchQuery}"</p>
                    <button
                        onClick={() => setSearchQuery("")}
                        className="text-xs text-primary hover:underline mt-1"
                    >
                        Clear search
                    </button>
                </div>
            )}

            {/* List view */}
            {viewMode === "list" && filteredVideos.length > 0 && (
                <div data-testid="video-grid" className="rounded-lg border overflow-hidden" role="list" aria-label="Video list">
                    <div className="hidden md:grid md:grid-cols-[120px_1fr_120px_100px] lg:grid-cols-[120px_1fr_120px_120px_100px] xl:grid-cols-[120px_1fr_120px_120px_80px_100px] gap-6 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b">
                        <div>Thumbnail</div>
                        <div>Description</div>
                        <div className="text-center">Source</div>
                        <div className="hidden lg:block text-center">Video type</div>
                        <div className="hidden xl:block text-center">Ratio</div>
                        <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-border">
                        {filteredVideos.map((video) => (
                            <div
                                key={video.id}
                                role="listitem"
                                className={cn(
                                    "transition-opacity duration-300 bg-card",
                                    deletingIds.has(video.id) && "opacity-40 pointer-events-none"
                                )}
                            >
                                <VideoCard
                                    video={video}
                                    onClick={() => onVideoClick(video.id)}
                                    onDelete={onDeleteVideo ? handleDelete : undefined}
                                    onRename={onRenameVideo}
                                    onDuplicate={onDuplicateVideo}
                                    isDeleting={deletingIds.has(video.id)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Grid view */}
            {viewMode === "grid" && filteredVideos.length > 0 && (
                <div
                    data-testid="video-grid-cards"
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                    role="list"
                    aria-label="Video grid"
                >
                    {filteredVideos.map((video) => (
                        <div
                            key={video.id}
                            role="listitem"
                            className={cn(
                                "transition-opacity duration-300",
                                deletingIds.has(video.id) && "opacity-40 pointer-events-none"
                            )}
                        >
                            <VideoGridCard
                                video={video}
                                onClick={() => onVideoClick(video.id)}
                                onDelete={onDeleteVideo ? handleDelete : undefined}
                                onRename={onRenameVideo}
                                onDuplicate={onDuplicateVideo}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


/**
 * Shows demo videos in grid view using static data from DEMO_VIDEOS.
 * No API call needed — thumbnails are hardcoded for instant loading.
 */
function DemoVideoSection({
    onVideoClick,
    className,
}: {
    onVideoClick: (videoId: string) => void;
    className?: string;
}) {
    return (
        <div className={cn("space-y-3 py-4", className)}>
            <div className="flex items-center gap-2">
                <HugeVideoIcon className="size-5" />
                <h2 className="text-lg font-semibold">Demo Videos</h2>
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase tracking-wider">
                    Try it
                </span>
            </div>
            <p className="text-sm text-muted-foreground">
                Explore real videos with AI-generated clips. Edit captions, try styles, and see the full workflow.
            </p>

            {/* Grid view */}
            <div
                data-testid="demo-video-grid"
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                role="list"
                aria-label="Demo video grid"
            >
                {DEMO_VIDEOS.map((video) => (
                    <div key={video.id} role="listitem">
                        <VideoGridCard
                            video={video}
                            onClick={() => onVideoClick(video.id)}
                        />
                    </div>
                ))}
            </div>

            {/* "No videos yet" section — commented out for now
            <div className="mx-auto max-w-5xl rounded-[28px] border border-border/70 bg-card px-6 py-7 sm:px-8 sm:py-8">
                ...
            </div>
            */}
        </div>
    );
}
