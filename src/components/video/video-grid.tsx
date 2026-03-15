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
        const steps = [
            {
                num: "1",
                icon: <IconUpload className="size-5" />,
                title: "Upload or paste a YouTube link",
                desc: "Drop any video file or paste a YouTube URL above.",
            },
            {
                num: "2",
                icon: <HugeVideoIcon className="size-5" />,
                title: "AI generates your clips",
                desc: "ScaleReach finds the best moments, reframes them, and adds captions automatically.",
            },
            {
                num: "3",
                icon: (
                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />
                    </svg>
                ),
                title: "Schedule & post everywhere",
                desc: "Publish to TikTok, Instagram, YouTube Shorts, and more from one workflow.",
            },
        ];

        const highlightBadges = ["YouTube URLs", "Direct uploads", "Auto captions", "Multi-platform posting"];

        return (
            <div className={cn("py-8 sm:py-10", className)}>
                <div className="mx-auto max-w-5xl rounded-[28px] border border-border/70 bg-card px-6 py-7 sm:px-8 sm:py-8">
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
                        <div className="space-y-5">
                            {headerSlot && (
                                <div className="flex items-center text-muted-foreground">
                                    {headerSlot}
                                </div>
                            )}

                            <div className="space-y-4">
                                <span className="inline-flex items-center rounded-full border border-border/70 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    Create your first video
                                </span>

                                <div className="space-y-3">
                                    <h3
                                        className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
                                        style={{ fontFamily: "var(--font-lexend)" }}
                                    >
                                        No videos yet
                                    </h3>

                                    <p className="max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                                        Paste a YouTube link or upload a file above to get started. ScaleReach turns long-form
                                        content into short clips in three simple steps.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {highlightBadges.map((badge) => (
                                    <span
                                        key={badge}
                                        className="rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground"
                                    >
                                        {badge}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-3xl border border-border/70 bg-background/20">
                            {steps.map((step, index) => (
                                <div
                                    key={step.num}
                                    className={cn(
                                        "flex gap-5 px-6 py-6 sm:px-7 sm:py-7",
                                        index !== steps.length - 1 && "border-b border-border/70"
                                    )}
                                >
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                        {step.icon}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <p
                                                className="text-xl font-semibold tracking-tight text-foreground sm:text-[1.75rem] sm:leading-[1.15]"
                                                style={{ fontFamily: "var(--font-lexend)" }}
                                            >
                                                {step.title}
                                            </p>
                                            <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                                Step {step.num}
                                            </span>
                                        </div>
                                        <p className="mt-3 max-w-lg text-base leading-8 text-muted-foreground">
                                            {step.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
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
