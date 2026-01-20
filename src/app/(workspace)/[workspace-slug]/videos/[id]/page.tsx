"use client";

import { use, useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconLoader2,
    IconVideo,
    IconRefresh,
} from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { LazyVideoPlayer, LazyTranscriptEditor } from "@/components/lazy";
import type { VideoPlayerRef } from "@/components/video/video-player";
import type { TranscriptEditorRef } from "@/components/transcript/transcript-editor";
import { ClipsList } from "@/components/clips/clips-list";
import { ClipFilters } from "@/components/clips/clip-filters";
import { useVideo, useVideoStatus } from "@/hooks/useVideo";
import type { ClipFilters as ClipFiltersType } from "@/lib/api/clips";

// ============================================================================
// Types
// ============================================================================

interface VideoDetailPageProps {
    params: Promise<{
        "workspace-slug": string;
        id: string;
    }>;
}

// ============================================================================
// Status Badge Component
// ============================================================================

interface StatusBadgeProps {
    status: string;
}

function StatusBadge({ status }: StatusBadgeProps) {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon?: React.ReactNode }> = {
        pending: { label: "Pending", variant: "secondary", icon: <IconLoader2 className="size-3 animate-spin" /> },
        downloading: { label: "Downloading", variant: "secondary", icon: <IconLoader2 className="size-3 animate-spin" /> },
        uploading: { label: "Uploading", variant: "secondary", icon: <IconLoader2 className="size-3 animate-spin" /> },
        transcribing: { label: "Transcribing", variant: "secondary", icon: <IconLoader2 className="size-3 animate-spin" /> },
        analyzing: { label: "Analyzing", variant: "secondary", icon: <IconLoader2 className="size-3 animate-spin" /> },
        completed: { label: "Completed", variant: "default" },
        failed: { label: "Failed", variant: "destructive", icon: <IconAlertCircle className="size-3" /> },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const };

    return (
        <Badge variant={config.variant} className="gap-1">
            {config.icon}
            {config.label}
        </Badge>
    );
}

// ============================================================================
// Loading State Component
// ============================================================================

function VideoDetailLoading() {
    return (
        <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Spinner />
                <p className="text-sm text-muted-foreground">Loading video...</p>
            </div>
        </div>
    );
}

// ============================================================================
// Error State Component
// ============================================================================

interface VideoDetailErrorProps {
    error: Error | null;
    onRetry?: () => void;
}

function VideoDetailError({ error, onRetry }: VideoDetailErrorProps) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
            <EmptyState
                icon={<IconAlertCircle className="size-6" />}
                title="Failed to load video"
                description={error?.message || "An error occurred while loading the video. Please try again."}
                action={
                    onRetry
                        ? {
                            label: "Try again",
                            onClick: onRetry,
                        }
                        : undefined
                }
            />
        </div>
    );
}

// ============================================================================
// Not Found State Component
// ============================================================================

interface VideoNotFoundProps {
    workspaceSlug: string;
}

function VideoNotFound({ workspaceSlug }: VideoNotFoundProps) {
    return (
        <div className="flex min-h-[50vh] items-center justify-center p-4">
            <EmptyState
                icon={<IconVideo className="size-6" />}
                title="Video not found"
                description="The video you're looking for doesn't exist or has been deleted."
                action={{
                    label: "Go back to workspace",
                    onClick: () => window.location.href = `/${workspaceSlug}`,
                }}
            />
        </div>
    );
}

// ============================================================================
// Processing State Component
// ============================================================================

interface VideoProcessingProps {
    status: string;
    progress?: number;
}

function VideoProcessing({ status, progress }: VideoProcessingProps) {
    const statusMessages: Record<string, string> = {
        pending: "Your video is queued for processing...",
        downloading: "Downloading video from source...",
        uploading: "Uploading video to storage...",
        transcribing: "Generating transcript with AI...",
        analyzing: "Detecting viral clips...",
    };

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-12">
            <div className="relative">
                <div className="size-16 rounded-full border-4 border-muted" />
                <div className="absolute inset-0 size-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="font-medium">Processing Video</h3>
                <p className="text-sm text-muted-foreground">
                    {statusMessages[status] || "Processing..."}
                </p>
                {progress !== undefined && progress > 0 && (
                    <p className="text-xs text-muted-foreground">{progress}% complete</p>
                )}
            </div>
        </div>
    );
}


// ============================================================================
// Main Video Detail Page Component
// ============================================================================

/**
 * Video Detail Page
 * 
 * Displays video player, transcript editor, and clips list for a specific video.
 * Handles loading, error, and processing states.
 * 
 * Route: /{workspace-slug}/videos/{id}
 * 
 * @validates Requirements 4.1, 6.1, 8.1
 */
export default function VideoDetailPage({ params }: VideoDetailPageProps) {
    const { "workspace-slug": workspaceSlug, id: videoId } = use(params);
    const router = useRouter();

    // Refs for component communication
    const videoPlayerRef = useRef<VideoPlayerRef>(null);
    const transcriptEditorRef = useRef<TranscriptEditorRef>(null);

    // State
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
    const [clipFilters, setClipFilters] = useState<ClipFiltersType>({
        sortBy: "score",
        sortOrder: "desc",
    });
    const [activeTab, setActiveTab] = useState<string>("clips");

    // Fetch video data
    const {
        data: video,
        isLoading: videoLoading,
        error: videoError,
        refetch: refetchVideo,
    } = useVideo(videoId);

    // Poll for status updates if video is processing
    const isProcessing = video?.status && !["completed", "failed"].includes(video.status);
    const { data: statusData } = useVideoStatus(videoId, isProcessing);

    // Use status data if available, otherwise use video data
    const currentVideo = statusData?.video || video;
    const currentStatus = currentVideo?.status || "pending";

    // Handle time update from video player
    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    // Handle segment click from transcript editor - seek video
    const handleSegmentClick = useCallback((timestamp: number) => {
        videoPlayerRef.current?.seek(timestamp);
    }, []);

    // Handle clip selection - navigate to clip editor
    const handleClipSelect = useCallback((clipId: string) => {
        setSelectedClipId(clipId);
        // Navigate to clip editor page
        router.push(`/${workspaceSlug}/clips/${clipId}`);
    }, [router, workspaceSlug]);

    // Handle filter changes
    const handleFiltersChange = useCallback((filters: ClipFiltersType) => {
        setClipFilters(filters);
    }, []);

    // Loading state
    if (videoLoading) {
        return <VideoDetailLoading />;
    }

    // Error state
    if (videoError) {
        return (
            <VideoDetailError
                error={videoError as Error}
                onRetry={() => refetchVideo()}
            />
        );
    }

    // Not found state
    if (!currentVideo) {
        return <VideoNotFound workspaceSlug={workspaceSlug} />;
    }

    // Failed state
    if (currentStatus === "failed") {
        return (
            <div className="container max-w-7xl py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${workspaceSlug}`)}
                        aria-label="Go back"
                    >
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-semibold truncate">
                            {currentVideo.title || "Untitled Video"}
                        </h1>
                    </div>
                    <StatusBadge status={currentStatus} />
                </div>

                {/* Error message */}
                <EmptyState
                    icon={<IconAlertCircle className="size-6" />}
                    title="Video processing failed"
                    description={currentVideo.errorMessage || "An error occurred while processing this video."}
                    action={{
                        label: "Go back to workspace",
                        onClick: () => router.push(`/${workspaceSlug}`),
                    }}
                />
            </div>
        );
    }


    // Processing state - show progress
    if (isProcessing) {
        return (
            <div className="container max-w-7xl py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${workspaceSlug}`)}
                        aria-label="Go back"
                    >
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-semibold truncate">
                            {currentVideo.title || "Untitled Video"}
                        </h1>
                    </div>
                    <StatusBadge status={currentStatus} />
                </div>

                {/* Processing indicator */}
                <div className="rounded-lg border bg-card">
                    <VideoProcessing status={currentStatus} />
                </div>
            </div>
        );
    }

    // Completed state - show full interface
    const videoUrl = currentVideo.storageUrl || "";
    const thumbnailUrl = (currentVideo.metadata?.thumbnail as string) || undefined;

    return (
        <div className="container max-w-7xl py-4 md:py-6 px-4 md:px-6 space-y-4 md:space-y-6">
            {/* Header - Responsive layout for mobile */}
            {/* @validates Requirement 31.3 - Mobile-friendly experience */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/${workspaceSlug}`)}
                        aria-label="Go back"
                        className="shrink-0"
                    >
                        <IconArrowLeft className="size-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-lg sm:text-xl font-semibold truncate">
                            {currentVideo.title || "Untitled Video"}
                        </h1>
                        {currentVideo.duration && (
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                Duration: {formatDuration(currentVideo.duration)}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex justify-end sm:justify-start">
                    <StatusBadge status={currentStatus} />
                </div>
            </div>

            {/* Main Content Grid - Responsive for desktop/tablet/mobile */}
            {/* @validates Requirements 31.1, 31.2, 31.3 - Desktop, tablet, mobile layouts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Left Column - Video Player */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Video Player (Requirement 8.1) - Maintains aspect ratio */}
                    {/* @validates Requirement 31.4 - Video aspect ratio maintenance */}
                    {/* @validates Requirements 35.1, 35.2 - Lazy loaded for code splitting */}
                    {videoUrl ? (
                        <LazyVideoPlayer
                            src={videoUrl}
                            poster={thumbnailUrl}
                            onTimeUpdate={handleTimeUpdate}
                            className="aspect-video w-full rounded-lg overflow-hidden"
                        />
                    ) : (
                        <div className="aspect-video w-full rounded-lg border bg-muted flex items-center justify-center">
                            <div className="text-center space-y-2">
                                <IconVideo className="size-8 sm:size-12 mx-auto text-muted-foreground" />
                                <p className="text-xs sm:text-sm text-muted-foreground">Video not available</p>
                            </div>
                        </div>
                    )}

                    {/* Tabs for Transcript and Details */}
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="w-full justify-start overflow-x-auto">
                            <TabsTrigger value="clips" className="text-sm">Clips</TabsTrigger>
                            <TabsTrigger value="transcript" className="text-sm">Transcript</TabsTrigger>
                        </TabsList>

                        {/* Clips Tab (Requirement 6.1) */}
                        <TabsContent value="clips" className="mt-4">
                            <div className="space-y-4">
                                {/* Filters - Collapsible on mobile */}
                                <ClipFilters
                                    filters={clipFilters}
                                    onChange={handleFiltersChange}
                                    totalCount={0}
                                    filteredCount={0}
                                />

                                {/* Clips List */}
                                <ClipsList
                                    videoId={videoId}
                                    onClipSelect={handleClipSelect}
                                    selectedClipId={selectedClipId}
                                    filters={clipFilters}
                                    viewMode="grid"
                                />
                            </div>
                        </TabsContent>

                        {/* Transcript Tab (Requirement 4.1) */}
                        {/* @validates Requirements 35.1, 35.2 - Lazy loaded for code splitting */}
                        <TabsContent value="transcript" className="mt-4">
                            <LazyTranscriptEditor
                                videoId={videoId}
                                currentTime={currentTime}
                                onSegmentClick={handleSegmentClick}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Column - Quick Info Panel */}
                {/* On mobile, this appears below the main content */}
                <div className="space-y-4 order-last lg:order-0">
                    {/* Video Info Card */}
                    <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3 sm:space-y-4">
                        <h3 className="font-medium text-sm sm:text-base">Video Details</h3>
                        <dl className="space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between">
                                <dt className="text-muted-foreground">Source</dt>
                                <dd className="capitalize">{currentVideo.sourceType}</dd>
                            </div>
                            {currentVideo.duration && (
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Duration</dt>
                                    <dd>{formatDuration(currentVideo.duration)}</dd>
                                </div>
                            )}
                            {typeof currentVideo.metadata?.fileSize === 'number' && (
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">File Size</dt>
                                    <dd>{formatFileSize(currentVideo.metadata.fileSize)}</dd>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <dt className="text-muted-foreground">Status</dt>
                                <dd><StatusBadge status={currentStatus} /></dd>
                            </div>
                            {currentVideo.createdAt && (
                                <div className="flex justify-between">
                                    <dt className="text-muted-foreground">Created</dt>
                                    <dd>{new Date(currentVideo.createdAt).toLocaleDateString()}</dd>
                                </div>
                            )}
                        </dl>
                    </div>

                    {/* Quick Actions */}
                    <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3">
                        <h3 className="font-medium text-sm sm:text-base">Quick Actions</h3>
                        <div className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start text-sm"
                                onClick={() => refetchVideo()}
                            >
                                <IconRefresh className="size-4 mr-2" />
                                Refresh Data
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format duration in seconds to MM:SS or HH:MM:SS format
 */
function formatDuration(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Format file size in bytes to human-readable format
 */
function formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}