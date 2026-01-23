"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconLoader2,
    IconVideo,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonVideo, SkeletonTranscript, SkeletonList } from "@/components/ui/skeletons";
import {
    ResizablePanel,
    ResizableHandle,
} from "@/components/ui/resizable";
import { Group as PanelGroup } from "react-resizable-panels";
import { VideoPlayer, type VideoPlayerRef } from "@/components/video/video-player";
import { TranscriptEditor, type TranscriptEditorRef } from "@/components/transcript/transcript-editor";
import { ClipsList } from "@/components/clips/clips-list";
import { ClipFilters } from "@/components/clips/clip-filters";
import { useVideo } from "@/hooks/useVideo";
import { useClipsByVideo } from "@/hooks/useClips";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import type { ClipFilters as ClipFiltersType } from "@/lib/api/clips";

// ============================================================================
// Types
// ============================================================================

interface VideoDetailPageProps {
    params: Promise<{ "workspace-slug": string; id: string }>;
}

// ============================================================================
// Default Filter Values
// ============================================================================

const DEFAULT_FILTERS: ClipFiltersType = {
    minScore: 0,
    maxScore: 100,
    favorited: undefined,
    sortBy: "score",
    sortOrder: "desc",
};

// ============================================================================
// Loading State Component
// ============================================================================

function VideoDetailLoading() {
    return (
        <div className="flex h-full flex-col">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-6 w-48" />
            </div>

            {/* Content skeleton - Desktop layout */}
            <div className="hidden flex-1 md:flex">
                <div className="flex flex-1 flex-col border-r p-4">
                    <SkeletonVideo aspectRatio="16:9" showControls className="mb-4" />
                    <SkeletonTranscript segments={4} />
                </div>
                <div className="w-80 p-4">
                    <Skeleton className="mb-4 h-48 w-full rounded-lg" />
                    <SkeletonList count={3} itemType="card" gap={12} />
                </div>
            </div>

            {/* Content skeleton - Mobile layout */}
            <div className="flex flex-1 flex-col gap-4 p-4 md:hidden">
                <SkeletonVideo aspectRatio="16:9" showControls />
                <SkeletonTranscript segments={3} />
                <Skeleton className="h-48 w-full rounded-lg" />
                <SkeletonList count={2} itemType="card" gap={12} />
            </div>
        </div>
    );
}

// ============================================================================
// Error State Component
// ============================================================================

interface VideoDetailErrorProps {
    error: Error | null;
    onBack: () => void;
}

function VideoDetailError({ error, onBack }: VideoDetailErrorProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="size-8 text-destructive" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Failed to load video</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {error?.message || "An error occurred while loading the video."}
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

// ============================================================================
// Video Not Found Component
// ============================================================================

interface VideoNotFoundProps {
    onBack: () => void;
}

function VideoNotFound({ onBack }: VideoNotFoundProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                <IconVideo className="size-8 text-muted-foreground" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Video not found</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    The video you&apos;re looking for doesn&apos;t exist or has been deleted.
                </p>
            </div>
            <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 size-4" />
                Go Back
            </Button>
        </div>
    );
}

// ============================================================================
// Video Processing State Component
// ============================================================================

interface VideoProcessingProps {
    status: string;
    title?: string;
}

function VideoProcessing({ status, title }: VideoProcessingProps) {
    const statusMessages: Record<string, string> = {
        downloading: "Downloading video...",
        uploading: "Uploading video...",
        transcribing: "Transcribing audio...",
        analyzing: "Analyzing for viral clips...",
        processing: "Processing video...",
    };

    return (
        <div className="flex h-64 flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30">
            <IconLoader2 className="size-8 animate-spin text-primary" />
            <div className="text-center">
                <h3 className="font-medium">{title || "Video"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    {statusMessages[status] || "Processing..."}
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// Main Video Detail Page Component
// ============================================================================

/**
 * VideoDetailPage - Displays video player, transcript editor, and clips list
 * 
 * Features:
 * - Video playback with custom controls
 * - Transcript editing with word-level timing
 * - Clips list with filtering and sorting
 * - Responsive layout with resizable panels on desktop
 * - Navigation to clip editor on clip selection
 * 
 * @validates Requirements 4.1, 5.1, 6.1, 7.1
 */
export default function VideoDetailPage({ params }: VideoDetailPageProps) {
    const { "workspace-slug": slug, id: videoId } = use(params);
    const router = useRouter();

    // Refs for video player and transcript editor
    const videoPlayerRef = useRef<VideoPlayerRef>(null);
    const transcriptEditorRef = useRef<TranscriptEditorRef>(null);

    // Scroll position restoration hook
    // @validates Requirements 12.2 - Preserve user's position when navigating back
    const { restoreScrollPosition, saveScrollPosition } = useScrollPosition(`video_clips_${videoId}`);

    // Restore scroll position on mount (when navigating back from editing screen)
    useEffect(() => {
        // Small delay to ensure DOM is ready
        const timeoutId = setTimeout(() => {
            restoreScrollPosition();
        }, 100);
        return () => clearTimeout(timeoutId);
    }, [restoreScrollPosition]);

    // State for current playback time and clip filters
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedClipId, setSelectedClipId] = useState<string | undefined>();
    const [clipFilters, setClipFilters] = useState<ClipFiltersType>(DEFAULT_FILTERS);
    const [clipsViewMode, setClipsViewMode] = useState<"grid" | "list">("list");

    // Fetch video data
    const {
        data: video,
        isLoading: videoLoading,
        error: videoError,
    } = useVideo(videoId);

    // Fetch clips data for filter counts
    const { data: clips } = useClipsByVideo(videoId, clipFilters);
    const { data: allClips } = useClipsByVideo(videoId);

    // Navigation handlers
    const handleBack = useCallback(() => {
        router.push(`/${slug}`);
    }, [router, slug]);

    /**
     * Handle clip selection - save scroll position and navigate to clip editor
     * @validates Requirements 12.2 - Preserve user's position when navigating back
     * @validates Requirements 12.5 - Update browser URL on navigation
     */
    const handleClipSelect = useCallback(
        (clipId: string) => {
            setSelectedClipId(clipId);
            // Save scroll position before navigating to clip editor
            saveScrollPosition();
            // Navigate to clip editor
            router.push(`/${slug}/clips/${clipId}`);
        },
        [router, slug, saveScrollPosition]
    );

    // Video player time update handler
    const handleTimeUpdate = useCallback((time: number) => {
        setCurrentTime(time);
    }, []);

    // Transcript segment click handler - seek video to timestamp
    const handleSegmentClick = useCallback((timestamp: number) => {
        videoPlayerRef.current?.seek(timestamp);
    }, []);

    // Loading state
    if (videoLoading) {
        return <VideoDetailLoading />;
    }

    // Error state
    if (videoError) {
        return <VideoDetailError error={videoError as Error} onBack={handleBack} />;
    }

    // Not found state
    if (!video) {
        return <VideoNotFound onBack={handleBack} />;
    }

    // Check if video is still processing
    const isProcessing = ["downloading", "uploading", "transcribing", "analyzing", "processing"].includes(
        video.status
    );

    // Get video source URL and thumbnail
    const videoSrc = video.storageUrl || video.sourceUrl || "";
    const thumbnailUrl = (video.metadata?.thumbnail as string) || undefined;

    return (
        <div className="flex h-full flex-col">
            {/* Header with back button and video title */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Go back"
                >
                    <IconArrowLeft className="size-5" />
                </Button>
                <h1 className="truncate text-lg font-semibold">{video.title}</h1>
            </div>

            {/* Desktop Layout - Resizable panels */}
            <div className="hidden flex-1 overflow-hidden md:block">
                <PanelGroup orientation="horizontal" className="h-full">
                    {/* Left Panel - Video Player and Transcript */}
                    <ResizablePanel defaultSize={65} minSize={40}>
                        <div className="flex h-full flex-col overflow-hidden">
                            {/* Video Player */}
                            <div className="shrink-0 p-4 pb-2">
                                {isProcessing ? (
                                    <VideoProcessing status={video.status} title={video.title ?? undefined} />
                                ) : videoSrc ? (
                                    <VideoPlayer
                                        ref={videoPlayerRef}
                                        src={videoSrc}
                                        poster={thumbnailUrl}
                                        onTimeUpdate={handleTimeUpdate}
                                        className="aspect-video w-full"
                                    />
                                ) : (
                                    <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
                                        <p className="text-sm text-muted-foreground">
                                            Video source not available
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Transcript Editor */}
                            <div className="min-h-0 flex-1 overflow-hidden px-4 pb-4">
                                <TranscriptEditor
                                    ref={transcriptEditorRef}
                                    videoId={videoId}
                                    currentTime={currentTime}
                                    onSegmentClick={handleSegmentClick}
                                />
                            </div>
                        </div>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right Panel - Clips Filters and List */}
                    <ResizablePanel defaultSize={35} minSize={25}>
                        <div className="flex h-full flex-col overflow-hidden">
                            {/* Clip Filters */}
                            <div className="shrink-0 p-4 pb-2">
                                <ClipFilters
                                    filters={clipFilters}
                                    onChange={setClipFilters}
                                    totalCount={allClips?.length || 0}
                                    filteredCount={clips?.length || 0}
                                    syncToUrl={false}
                                />
                            </div>

                            {/* Clips List */}
                            <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
                                <ClipsList
                                    videoId={videoId}
                                    onClipSelect={handleClipSelect}
                                    selectedClipId={selectedClipId}
                                    filters={clipFilters}
                                    viewMode={clipsViewMode}
                                    onViewModeChange={setClipsViewMode}
                                />
                            </div>
                        </div>
                    </ResizablePanel>
                </PanelGroup>
            </div>

            {/* Mobile Layout - Stacked panels */}
            {/* @validates Requirement 31.3 - Mobile-friendly experience */}
            <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 md:hidden">
                {/* Video Player */}
                <div className="shrink-0">
                    {isProcessing ? (
                        <VideoProcessing status={video.status} title={video.title ?? undefined} />
                    ) : videoSrc ? (
                        <VideoPlayer
                            ref={videoPlayerRef}
                            src={videoSrc}
                            poster={thumbnailUrl}
                            onTimeUpdate={handleTimeUpdate}
                            className="aspect-video w-full"
                        />
                    ) : (
                        <div className="flex aspect-video w-full items-center justify-center rounded-lg border bg-muted">
                            <p className="text-sm text-muted-foreground">
                                Video source not available
                            </p>
                        </div>
                    )}
                </div>

                {/* Transcript Editor */}
                <div className="shrink-0">
                    <TranscriptEditor
                        ref={transcriptEditorRef}
                        videoId={videoId}
                        currentTime={currentTime}
                        onSegmentClick={handleSegmentClick}
                    />
                </div>

                {/* Clip Filters */}
                <div className="shrink-0">
                    <ClipFilters
                        filters={clipFilters}
                        onChange={setClipFilters}
                        totalCount={allClips?.length || 0}
                        filteredCount={clips?.length || 0}
                        syncToUrl={false}
                    />
                </div>

                {/* Clips List */}
                <div className="shrink-0">
                    <ClipsList
                        videoId={videoId}
                        onClipSelect={handleClipSelect}
                        selectedClipId={selectedClipId}
                        filters={clipFilters}
                        viewMode={clipsViewMode}
                        onViewModeChange={setClipsViewMode}
                    />
                </div>
            </div>
        </div>
    );
}
