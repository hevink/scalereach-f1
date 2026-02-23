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
        const steps = [
            {
                num: "1",
                icon: <IconUpload className="size-4 text-primary" />,
                title: "Upload or paste a YouTube link",
                desc: "Drop any video file or paste a YouTube URL above.",
            },
            {
                num: "2",
                icon: <IconVideo className="size-4 text-primary" />,
                title: "AI generates your clips",
                desc: "ScaleReach finds the best moments and adds captions automatically.",
            },
            {
                num: "3",
                icon: (
                    <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                        <line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>
                    </svg>
                ),
                title: "Schedule & post everywhere",
                desc: "Publish to TikTok, Instagram, YouTube Shorts, and more in one click.",
            },
        ];

        return (
            <div className={cn(
                "flex flex-col items-center py-12 px-4",
                "rounded-2xl border-2 border-dashed bg-muted/20",
                className
            )}>
                <h3 className="text-lg font-semibold mb-1">No videos yet</h3>
                <p className="text-sm text-muted-foreground mb-8 text-center max-w-xs">
                    Paste a YouTube link or upload a file above to get started.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl">
                    {steps.map((step, i) => (
                        <div key={step.num} className="flex flex-1 flex-col gap-2 rounded-xl border bg-card p-4">
                            <div className="flex items-center gap-2">
                                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                    {step.num}
                                </div>
                                {step.icon}
                            </div>
                            <p className="text-sm font-medium">{step.title}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
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
            {/* Column Headers - hidden on mobile, shown as table on md+ */}
            <div className="hidden md:grid md:grid-cols-[80px_1fr_140px_100px] lg:grid-cols-[80px_1fr_140px_140px_100px] xl:grid-cols-[80px_1fr_140px_140px_100px_100px] gap-6 px-6 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b">
                <div>Thumbnail</div>
                <div>Description</div>
                <div className="text-center">Source</div>
                <div className="hidden lg:block text-center">Video type</div>
                <div className="hidden xl:block text-center">Ratio</div>
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
