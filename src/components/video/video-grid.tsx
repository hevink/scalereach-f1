"use client";

import { useState, useCallback } from "react";
import type React from "react";
import { VideoLite } from "@/lib/api/video";
import { VideoCard } from "./video-card";
import { VideoGridCard } from "./video-grid-card";
import { SkeletonVideoGrid } from "@/components/ui/skeletons";
import { IconVideo, IconUpload, IconList, IconLayoutGrid } from "@tabler/icons-react";
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
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");

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
        return <SkeletonVideoGrid count={10} className={className} />;
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
                icon: <IconVideo className="size-5" />,
                title: "AI generates your clips",
                desc: "ScaleReach finds the best moments and adds captions automatically.",
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
                desc: "Publish to TikTok, Instagram, YouTube Shorts, and more in one click.",
            },
        ];

        return (
            <div className={cn("flex flex-col items-center py-16 px-6", className)}>
                {/* Header */}
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-semibold mb-2">No videos yet</h3>
                    <p className="text-muted-foreground max-w-md">
                        Paste a YouTube link or upload a file above to get started
                    </p>
                </div>

                {/* Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl">
                    {steps.map((step, index) => (
                        <div
                            key={step.num}
                            className="relative flex flex-col items-center text-center p-6"
                        >
                            {/* Step indicator */}
                            <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary mb-4">
                                {step.icon}
                            </div>

                            {/* Step number */}
                            <span className="absolute top-4 right-4 text-xs font-medium text-muted-foreground/50">
                                {step.num}
                            </span>

                            {/* Content */}
                            <p className="text-sm font-medium mb-1">{step.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>

                            {/* Arrow connector (desktop only) */}
                            {index < steps.length - 1 && (
                                <div className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30">
                                    <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9 6l6 6-6 6" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
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
                        onClick={() => setViewMode("list")}
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
                        onClick={() => setViewMode("grid")}
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

            {/* List view */}
            {viewMode === "list" && (
                <div data-testid="video-grid" className="rounded-lg border overflow-hidden" role="list" aria-label="Video list">
                    <div className="hidden md:grid md:grid-cols-[80px_1fr_140px_100px] lg:grid-cols-[80px_1fr_140px_140px_100px] xl:grid-cols-[80px_1fr_140px_140px_100px_100px] gap-6 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 border-b">
                        <div>Thumbnail</div>
                        <div>Description</div>
                        <div className="text-center">Source</div>
                        <div className="hidden lg:block text-center">Video type</div>
                        <div className="hidden xl:block text-center">Ratio</div>
                        <div className="text-right">Actions</div>
                    </div>
                    <div className="divide-y divide-border">
                        {videos.map((video) => (
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
            {viewMode === "grid" && (
                <div
                    data-testid="video-grid-cards"
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3"
                    role="list"
                    aria-label="Video grid"
                >
                    {videos.map((video) => (
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
