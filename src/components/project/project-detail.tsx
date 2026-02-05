"use client";

import { useCallback, useMemo, useState } from "react";
import {
    IconClock,
    IconFilter,
    IconPlus,
    IconScissors,
    IconSortDescending,
    IconVideo,
    IconCalendar,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProject } from "@/hooks/useProject";
import { cn } from "@/lib/utils";
import type { Video } from "@/lib/api/video";
import type { ProjectStatus } from "@/lib/api/project";

/**
 * Video status type
 * @validates Requirement 26.1
 */
export type VideoStatus =
    | "pending"
    | "downloading"
    | "uploading"
    | "transcribing"
    | "analyzing"
    | "completed"
    | "failed";

/**
 * Sort options for videos
 * @validates Requirement 26.5
 */
export type VideoSortBy = "date" | "title" | "clipCount";

/**
 * ProjectDetailProps interface
 *
 * @validates Requirements 26.1, 26.2, 26.3, 26.4, 26.5, 26.6
 */
export interface ProjectDetailProps {
    /** The project ID to display */
    projectId: string;
    /** Callback when a video is selected */
    onVideoSelect: (videoId: string) => void;
    /** Callback when add video button is clicked */
    onAddVideo: () => void;
    /** Additional className */
    className?: string;
}

/**
 * Video with clip count for display
 */
interface VideoWithClipCount extends Video {
    clipCount?: number;
}

/**
 * Status badge variant mapping
 * @validates Requirement 26.1
 */
const videoStatusVariants: Record<
    VideoStatus,
    "default" | "secondary" | "outline" | "destructive"
> = {
    pending: "outline",
    downloading: "secondary",
    uploading: "secondary",
    transcribing: "secondary",
    analyzing: "secondary",
    completed: "default",
    failed: "destructive",
};

/**
 * Status display labels
 * @validates Requirement 26.1
 */
const videoStatusLabels: Record<VideoStatus, string> = {
    pending: "Pending",
    downloading: "Downloading",
    uploading: "Uploading",
    transcribing: "Transcribing",
    analyzing: "Analyzing",
    completed: "Completed",
    failed: "Failed",
};

/**
 * Project status badge variant mapping
 */
const projectStatusVariants: Record<
    ProjectStatus,
    "default" | "secondary" | "outline" | "destructive"
> = {
    draft: "outline",
    active: "default",
    completed: "secondary",
    archived: "destructive",
};

/**
 * Project status display labels
 */
const projectStatusLabels: Record<ProjectStatus, string> = {
    draft: "Draft",
    active: "Active",
    completed: "Completed",
    archived: "Archived",
};

/**
 * Format duration from seconds to MM:SS or HH:MM:SS
 * @validates Requirement 26.2
 */
function formatDuration(seconds: number | null | undefined): string {
    if (seconds === null || seconds === undefined) return "--:--";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format date to readable string
 * @validates Requirement 26.2
 */
function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

/**
 * VideoCard Component
 *
 * Displays a single video card with thumbnail, title, duration, status, and clip count.
 *
 * @validates Requirements 26.1, 26.2, 26.3
 */
function VideoCard({
    video,
    onClick,
}: {
    video: VideoWithClipCount;
    onClick: () => void;
}) {
    const status = video.status as VideoStatus;
    const thumbnailUrl = video.metadata?.thumbnail as string | undefined;

    return (
        <Card
            className="cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
            aria-label={`Video: ${video.title || "Untitled Video"}, Status: ${videoStatusLabels[status]}, ${video.clipCount ?? 0} clips`}
        >
            {/* Thumbnail - Requirement 26.1 */}
            <div className="relative aspect-video w-full bg-muted">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={`Thumbnail for video: ${video.title || "Untitled Video"}`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center" aria-label="No thumbnail available">
                        <IconVideo className="size-12 text-muted-foreground/50" aria-hidden="true" />
                    </div>
                )}
                {/* Duration overlay - Requirement 26.2 */}
                <div
                    className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-xs font-medium text-white"
                    aria-label={`Duration: ${formatDuration(video.duration)}`}
                >
                    {formatDuration(video.duration)}
                </div>
                {/* Status badge - Requirement 26.1 */}
                <div className="absolute left-2 top-2">
                    <Badge variant={videoStatusVariants[status]} aria-label={`Status: ${videoStatusLabels[status]}`}>
                        {videoStatusLabels[status]}
                    </Badge>
                </div>
            </div>
            <CardContent className="p-3">
                {/* Title - Requirement 26.2 */}
                <h3 className="line-clamp-2 text-sm font-medium">
                    {video.title || "Untitled Video"}
                </h3>
                {/* Metadata row - Requirements 26.2, 26.3 */}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    {/* Creation date - Requirement 26.2 */}
                    <div className="flex items-center gap-1" aria-label={`Created on ${formatDate(video.createdAt)}`}>
                        <IconCalendar className="size-3.5" aria-hidden="true" />
                        <span>{formatDate(video.createdAt)}</span>
                    </div>
                    {/* Clip count - Requirement 26.3 */}
                    <div className="flex items-center gap-1" aria-label={`${video.clipCount ?? 0} clips`}>
                        <IconScissors className="size-3.5" aria-hidden="true" />
                        <span>{video.clipCount ?? 0} clips</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * VideoCardSkeleton Component
 *
 * Loading skeleton for video cards.
 */
function VideoCardSkeleton() {
    return (
        <Card className="overflow-hidden">
            <Skeleton className="aspect-video w-full" />
            <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-2 flex items-center gap-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * ProjectInfoSkeleton Component
 *
 * Loading skeleton for project info header.
 */
function ProjectInfoSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-64" />
        </div>
    );
}

/**
 * NoVideosEmptyState Component
 *
 * Displayed when no videos exist in the project.
 * Uses the shared EmptyState component with appropriate icon, title, description, and CTA.
 * 
 * @validates Requirement 28.2
 */
function NoVideosEmptyState({ onAddVideo }: { onAddVideo: () => void }) {
    return (
        <EmptyState
            icon={<IconVideo className="size-6" />}
            title="No videos yet"
            description="Add your first video to start creating clips. Upload a video file or paste a YouTube URL."
            action={{
                label: "Add Video",
                onClick: onAddVideo,
            }}
        />
    );
}

/**
 * NoFilterResults Component
 *
 * Displayed when filter returns no results.
 * Uses the shared EmptyState component with filter-specific messaging.
 */
function NoFilterResults({
    statusFilter,
    onClearFilter,
}: {
    statusFilter: string;
    onClearFilter: () => void;
}) {
    return (
        <EmptyState
            icon={<IconFilter className="size-6" />}
            title="No videos found"
            description={`No videos match the "${videoStatusLabels[statusFilter as VideoStatus]}" status filter.`}
            action={{
                label: "Clear Filter",
                onClick: onClearFilter,
            }}
        />
    );
}

/**
 * ProjectDetail Component
 *
 * A project detail component that displays:
 * - Project information (name, description, status)
 * - Videos with thumbnails and status (Requirement 26.1)
 * - Video title, duration, creation date (Requirement 26.2)
 * - Clip count per video (Requirement 26.3)
 * - Filtering by status (Requirement 26.4)
 * - Sorting by date, title, clip count (Requirement 26.5)
 * - Add video button (Requirement 26.6)
 *
 * @example
 * ```tsx
 * <ProjectDetail
 *   projectId="project-123"
 *   onVideoSelect={(videoId) => router.push(`/videos/${videoId}`)}
 *   onAddVideo={() => setShowUploadDialog(true)}
 * />
 * ```
 *
 * @validates Requirements 26.1, 26.2, 26.3, 26.4, 26.5, 26.6
 */
export function ProjectDetail({
    projectId,
    onVideoSelect,
    onAddVideo,
    className,
}: ProjectDetailProps) {
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<VideoSortBy>("date");

    const { data: project, isLoading, error } = useProject(projectId);

    /**
     * Handle status filter change
     * @validates Requirement 26.4
     */
    const handleStatusFilterChange = useCallback((value: string | null) => {
        if (value) {
            setStatusFilter(value);
        }
    }, []);

    /**
     * Handle sort by change
     * @validates Requirement 26.5
     */
    const handleSortByChange = useCallback((value: string | null) => {
        if (value && (value === "date" || value === "title" || value === "clipCount")) {
            setSortBy(value);
        }
    }, []);

    /**
     * Filter and sort videos
     * @validates Requirements 26.4, 26.5
     */
    const filteredAndSortedVideos = useMemo(() => {
        if (!project?.videos) return [];

        let videos = [...project.videos] as VideoWithClipCount[];

        // Apply status filter - Requirement 26.4
        if (statusFilter !== "all") {
            videos = videos.filter((video) => video.status === statusFilter);
        }

        // Apply sorting - Requirement 26.5
        videos.sort((a, b) => {
            switch (sortBy) {
                case "date":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "title":
                    return (a.title || "").localeCompare(b.title || "");
                case "clipCount":
                    return (b.clipCount ?? 0) - (a.clipCount ?? 0);
                default:
                    return 0;
            }
        });

        return videos;
    }, [project?.videos, statusFilter, sortBy]);

    const hasVideos = project?.videos && project.videos.length > 0;
    const hasFilteredVideos = filteredAndSortedVideos.length > 0;

    return (
        <div className={cn("flex flex-col gap-4 sm:gap-6", className)} data-slot="project-detail">
            {/* Project Info Header */}
            {isLoading && <ProjectInfoSkeleton />}

            {!isLoading && !error && project && (
                <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <h1 className="text-xl sm:text-2xl font-bold">{project.name}</h1>
                        <Badge variant={projectStatusVariants[project.status]}>
                            {projectStatusLabels[project.status]}
                        </Badge>
                    </div>
                    {project.description && (
                        <p className="text-muted-foreground text-sm">{project.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <IconVideo className="size-4" />
                            <span>{project.videoCount ?? project.videos?.length ?? 0} videos</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <IconScissors className="size-4" />
                            <span>{project.clipCount ?? 0} clips</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Controls Row - Filter, Sort, Add Video */}
            {/* @validates Requirement 31.3 - Mobile-friendly controls */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Status Filter - Requirement 26.4 */}
                    <div className="flex items-center gap-2">
                        <IconFilter className="size-4 text-muted-foreground" />
                        <Select
                            value={statusFilter}
                            onValueChange={handleStatusFilterChange}
                            disabled={isLoading || !hasVideos}
                        >
                            <SelectTrigger className="w-[120px] sm:w-[140px] h-9 text-xs sm:text-sm" aria-label="Filter by status">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="downloading">Downloading</SelectItem>
                                <SelectItem value="uploading">Uploading</SelectItem>
                                <SelectItem value="transcribing">Transcribing</SelectItem>
                                <SelectItem value="analyzing">Analyzing</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Sort Dropdown - Requirement 26.5 */}
                    <div className="flex items-center gap-2">
                        <IconSortDescending className="size-4 text-muted-foreground" />
                        <Select
                            value={sortBy}
                            onValueChange={handleSortByChange}
                            disabled={isLoading || !hasVideos}
                        >
                            <SelectTrigger className="w-[110px] sm:w-[130px] h-9 text-xs sm:text-sm" aria-label="Sort by">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="date">
                                    <span className="flex items-center gap-2">
                                        <IconClock className="size-4" />
                                        Date
                                    </span>
                                </SelectItem>
                                <SelectItem value="title">
                                    <span className="flex items-center gap-2">
                                        <IconVideo className="size-4" />
                                        Title
                                    </span>
                                </SelectItem>
                                <SelectItem value="clipCount">
                                    <span className="flex items-center gap-2">
                                        <IconScissors className="size-4" />
                                        Clip Count
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Add Video Button - Requirement 26.6 */}
                <Button onClick={onAddVideo} className="w-full sm:w-auto">
                    <IconPlus className="mr-2 size-4" />
                    Add Video
                </Button>
            </div>

            {/* Error State */}
            {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 sm:p-4 text-center text-destructive text-sm">
                    <p>Failed to load project. Please try again.</p>
                </div>
            )}

            {/* Loading State */}
            {isLoading && (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, index) => (
                        <VideoCardSkeleton key={`skeleton-${index}`} />
                    ))}
                </div>
            )}

            {/* Empty State - No Videos - Requirement 28.2 */}
            {!isLoading && !error && !hasVideos && (
                <NoVideosEmptyState onAddVideo={onAddVideo} />
            )}

            {/* No Filter Results */}
            {!isLoading && !error && hasVideos && !hasFilteredVideos && statusFilter !== "all" && (
                <NoFilterResults
                    statusFilter={statusFilter}
                    onClearFilter={() => setStatusFilter("all")}
                />
            )}

            {/* Video Grid - Requirement 26.1 */}
            {/* @validates Requirements 31.1, 31.2, 31.3 - Responsive grid */}
            {!isLoading && !error && hasFilteredVideos && (
                <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAndSortedVideos.map((video) => (
                        <VideoCard
                            key={video.id}
                            video={video}
                            onClick={() => onVideoSelect(video.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default ProjectDetail;
