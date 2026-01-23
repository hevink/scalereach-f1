"use client";

import { use, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import {
    IconArrowLeft,
    IconAlertCircle,
    IconVideo,
    IconLoader2,
} from "@tabler/icons-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonList } from "@/components/ui/skeletons";
import { ClipFilters } from "@/components/clips/clip-filters";
import { ClipDetailModal, useClipModalUrlState } from "@/components/clips/clip-detail-modal";
import { useVideo } from "@/hooks/useVideo";
import { useClipsByVideo } from "@/hooks/useClips";
import type { ClipFilters as ClipFiltersType } from "@/lib/api/clips";

// ============================================================================
// Types
// ============================================================================

interface VideoClipsPageProps {
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

function VideoClipsLoading() {
    return (
        <div className="flex h-full flex-col">
            {/* Header skeleton */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-md" />
                <div className="flex flex-col gap-1">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
                {/* Filters skeleton */}
                <Skeleton className="h-48 w-full max-w-sm rounded-lg" />

                {/* Clips list skeleton */}
                <SkeletonList count={5} itemType="card" gap={12} />
            </div>
        </div>
    );
}

// ============================================================================
// Error State Component
// ============================================================================

interface VideoClipsErrorProps {
    error: Error | null;
    onBack: () => void;
}

function VideoClipsError({ error, onBack }: VideoClipsErrorProps) {
    return (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <IconAlertCircle className="size-8 text-destructive" />
            </div>
            <div className="text-center">
                <h2 className="text-lg font-semibold">Failed to load clips</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    {error?.message || "An error occurred while loading the clips."}
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
// No Clips Component
// ============================================================================

interface NoClipsProps {
    videoTitle: string;
    isProcessing: boolean;
}

function NoClips({ videoTitle, isProcessing }: NoClipsProps) {
    if (isProcessing) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
                <IconLoader2 className="size-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium">Processing Video</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Clips are being generated for &quot;{videoTitle}&quot;. This may take a few minutes.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border bg-muted/30 p-8">
            <IconVideo className="size-8 text-muted-foreground" />
            <div className="text-center">
                <h3 className="font-medium">No Clips Found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    No clips have been generated for this video yet.
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// Main Video Clips Page Component
// ============================================================================

/**
 * VideoClipsPage - Displays all clips from a selected video
 * 
 * Features:
 * - Header with video title and back button
 * - Clips displayed in a list format (NOT cards per requirement 2.2)
 * - Filtering and sorting controls
 * - Click on clip opens ClipDetailModal
 * - URL state sync for deep linking to specific clips
 * - Responsive layout for mobile and desktop
 * 
 * @validates Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 3.1
 */
export default function VideoClipsPage({ params }: VideoClipsPageProps) {
    const { "workspace-slug": slug, id: videoId } = use(params);
    const router = useRouter();

    // State for clip filters
    const [clipFilters, setClipFilters] = useState<ClipFiltersType>(DEFAULT_FILTERS);

    // Modal state management with URL sync
    // This enables deep linking to specific clips via ?clip=<clipId>
    const { selectedClipId, isOpen, openModal, closeModal } = useClipModalUrlState();

    // Fetch video data for header
    const {
        data: video,
        isLoading: videoLoading,
        error: videoError,
    } = useVideo(videoId);

    // Fetch clips data with filters
    const {
        data: clips,
        isLoading: clipsLoading,
        error: clipsError,
    } = useClipsByVideo(videoId, clipFilters);

    // Fetch all clips for filter counts (without filters)
    const { data: allClips } = useClipsByVideo(videoId);

    // Navigation handlers
    const handleBack = useCallback(() => {
        router.push(`/${slug}/videos/${videoId}`);
    }, [router, slug, videoId]);

    /**
     * Handle clip selection - opens the ClipDetailModal
     * Updates URL with ?clip=<clipId> for deep linking
     * 
     * @validates Requirements 2.4, 3.1
     */
    const handleClipSelect = useCallback(
        (clipId: string) => {
            openModal(clipId);
        },
        [openModal]
    );

    /**
     * Handle edit button click in modal - navigates to clip editor
     * 
     * @validates Requirements 3.6, 12.1
     */
    const handleEditClip = useCallback(
        (clipId: string) => {
            router.push(`/${slug}/clips/${clipId}`);
        },
        [router, slug]
    );

    // Loading state
    if (videoLoading || clipsLoading) {
        return <VideoClipsLoading />;
    }

    // Error state
    if (videoError || clipsError) {
        return (
            <VideoClipsError
                error={(videoError || clipsError) as Error}
                onBack={handleBack}
            />
        );
    }

    // Not found state
    if (!video) {
        return <VideoNotFound onBack={handleBack} />;
    }

    // Check if video is still processing
    const isProcessing = ["downloading", "uploading", "transcribing", "analyzing", "processing"].includes(
        video.status
    );

    return (
        <div className="flex h-full flex-col">
            {/* Header with back button and video title */}
            <div className="flex items-center gap-4 border-b px-4 py-3">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    aria-label="Go back to video"
                >
                    <IconArrowLeft className="size-5" />
                </Button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-lg font-semibold">
                        {video.title || "Untitled Video"} - Clips
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {clips?.length || 0} clip{(clips?.length || 0) !== 1 ? "s" : ""} found
                    </p>
                </div>
            </div>

            {/* Content area */}
            <div className="flex flex-1 flex-col gap-4 overflow-auto p-4 lg:flex-row">
                {/* Filters sidebar - Desktop: left side, Mobile: top */}
                <div className="w-full shrink-0 lg:w-72">
                    <ClipFilters
                        filters={clipFilters}
                        onChange={setClipFilters}
                        totalCount={allClips?.length || 0}
                        filteredCount={clips?.length || 0}
                        syncToUrl={true}
                    />
                </div>

                {/* Clips list */}
                <div className="min-w-0 flex-1">
                    {!clips || clips.length === 0 ? (
                        <NoClips
                            videoTitle={video.title || "this video"}
                            isProcessing={isProcessing}
                        />
                    ) : (
                        <div className="flex flex-col gap-3">
                            {clips.map((clip) => (
                                <ClipListItem
                                    key={clip.id}
                                    clip={clip}
                                    onClick={() => handleClipSelect(clip.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Clip Detail Modal */}
            <ClipDetailModal
                clipId={selectedClipId}
                isOpen={isOpen}
                onClose={closeModal}
                onEdit={handleEditClip}
            />
        </div>
    );
}

// ============================================================================
// Import ClipListItem from shared component
// ============================================================================

import { ClipListItem } from "@/components/clips/clip-list-item";
