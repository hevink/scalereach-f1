"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    IconX,
    IconFlame,
    IconEdit,
    IconClock,
    IconLoader2,
    IconBrandYoutube,
    IconBrandInstagram,
    IconBrandTiktok,
    IconBrandLinkedin,
    IconBrandTwitter,
    IconBrandFacebook,
    IconSparkles,
    IconMoodSmile,
    IconShare,
    IconChevronLeft,
    IconChevronRight,
    IconDownload,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useClip } from "@/hooks/useClips";
import type { ClipResponse, RecommendedPlatform } from "@/lib/api/clips";

// ============================================================================
// Types
// ============================================================================

/**
 * Platform configuration for icons and labels
 */
const PLATFORM_CONFIG: Record<RecommendedPlatform, { icon: React.ElementType; label: string; color: string }> = {
    youtube_shorts: { icon: IconBrandYoutube, label: "YouTube Shorts", color: "text-red-500" },
    instagram_reels: { icon: IconBrandInstagram, label: "Instagram Reels", color: "text-pink-500" },
    tiktok: { icon: IconBrandTiktok, label: "TikTok", color: "text-foreground" },
    linkedin: { icon: IconBrandLinkedin, label: "LinkedIn", color: "text-blue-600" },
    twitter: { icon: IconBrandTwitter, label: "Twitter", color: "text-sky-500" },
    facebook_reels: { icon: IconBrandFacebook, label: "Facebook Reels", color: "text-blue-500" },
};

/**
 * ClipDetailModalProps interface
 * 
 * @validates Requirements 3.1, 3.7
 */
export interface ClipDetailModalProps {
    /** The ID of the clip to display */
    clipId: string | null;
    /** Whether the modal is open */
    isOpen: boolean;
    /** Callback when the modal should close */
    onClose: () => void;
    /** Callback when the Edit button is clicked */
    onEdit: (clipId: string) => void;
    /** Callback to navigate to previous clip */
    onPrevious?: () => void;
    /** Callback to navigate to next clip */
    onNext?: () => void;
    /** Whether there's a previous clip */
    hasPrevious?: boolean;
    /** Whether there's a next clip */
    hasNext?: boolean;
    /** Optional className for the modal content */
    className?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format duration in seconds to MM:SS format
 */
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get color class for virality score
 * Green for high (≥70), yellow for medium (40-69), red for low (<40)
 * 
 * @validates Requirements 3.4
 */
function getScoreColor(score: number): string {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
}

/**
 * Get background color class for virality score badge
 */
function getScoreBgColor(score: number): string {
    if (score >= 70) return "bg-green-500/10";
    if (score >= 40) return "bg-yellow-500/10";
    return "bg-red-500/10";
}

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * LoadingState - Skeleton loading state for modal content
 */
function LoadingState() {
    return (
        <div
            className="flex flex-col gap-6 p-6"
            role="status"
            aria-label="Loading clip details"
            data-testid="modal-loading"
        >
            <div className="flex items-start justify-between">
                <Skeleton className="h-7 w-2/3" />
                <Skeleton className="size-8 rounded-full" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <Skeleton className="aspect-[9/16] w-full rounded-xl lg:col-span-2" />
                <div className="space-y-4 lg:col-span-3">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-24 w-full rounded-xl" />
                </div>
            </div>
        </div>
    );
}

/**
 * ErrorState - Error display with retry option
 */
interface ErrorStateProps {
    error: Error;
    onRetry?: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
    return (
        <div
            className="flex flex-col items-center justify-center gap-4 py-12 text-center"
            role="alert"
            data-testid="modal-error"
        >
            <div className="rounded-full bg-destructive/10 p-4">
                <IconX className="size-8 text-destructive" />
            </div>
            <div className="space-y-2">
                <h3 className="text-lg font-semibold">Failed to load clip</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    {error.message || "An error occurred while loading the clip details."}
                </p>
            </div>
            {onRetry && (
                <Button variant="outline" onClick={onRetry}>
                    Try again
                </Button>
            )}
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ClipDetailModal - Modal for displaying comprehensive clip details
 */
export function ClipDetailModal({
    clipId,
    isOpen,
    onClose,
    onEdit,
    onPrevious,
    onNext,
    hasPrevious = false,
    hasNext = false,
    className,
}: ClipDetailModalProps) {
    const {
        data: clip,
        isLoading,
        error,
        refetch,
    } = useClip(clipId ?? "");

    const handleOpenChange = React.useCallback(
        (open: boolean) => {
            if (!open) {
                onClose();
            }
        },
        [onClose]
    );

    const handleEdit = React.useCallback(() => {
        if (clipId) {
            onEdit(clipId);
        }
    }, [clipId, onEdit]);

    const handleDownload = React.useCallback(() => {
        if (clip?.storageUrl) {
            const link = document.createElement('a');
            link.href = clip.storageUrl;
            link.download = `${clip.title || 'clip'}.mp4`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }, [clip]);

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'ArrowLeft' && hasPrevious && onPrevious) {
                e.preventDefault();
                onPrevious();
            } else if (e.key === 'ArrowRight' && hasNext && onNext) {
                e.preventDefault();
                onNext();
            } else if (e.key === 'd' && clip?.storageUrl) {
                e.preventDefault();
                handleDownload();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, hasPrevious, hasNext, onPrevious, onNext, clip, handleDownload]);

    if (!clipId) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className={cn(
                    "max-w-4xl! w-full max-h-[90vh] overflow-hidden p-0",
                    className
                )}
                showCloseButton={false}
                data-testid="clip-detail-modal"
                aria-describedby="clip-modal-description"
            >
                {/* Loading State */}
                {isLoading && <LoadingState />}

                {/* Error State */}
                {error && !isLoading && (
                    <ErrorState
                        error={error instanceof Error ? error : new Error("Failed to load clip")}
                        onRetry={() => refetch()}
                    />
                )}

                {/* Content */}
                {clip && !isLoading && !error && (
                    <div className="flex flex-col">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
                            <div className="min-w-0 flex-1">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-semibold leading-tight">
                                        {clip.title}
                                    </DialogTitle>
                                </DialogHeader>
                                <DialogDescription className="sr-only" id="clip-modal-description">
                                    Details for clip: {clip.title}
                                </DialogDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="shrink-0 rounded-full"
                                aria-label="Close modal"
                            >
                                <IconX className="size-5" />
                            </Button>
                        </div>

                        {/* Main Content */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 overflow-y-auto max-h-[calc(90vh-200px)]">
                            {/* Left: Video Player */}
                            <div className="bg-black flex items-center justify-center p-6">
                                {clip.storageUrl ? (
                                    <video
                                        src={clip.storageUrl}
                                        poster={clip.thumbnailUrl}
                                        controls
                                        className="w-full max-h-[60vh] rounded-lg object-contain"
                                        aria-label={`Video: ${clip.title}`}
                                    >
                                        Your browser does not support the video tag.
                                    </video>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-muted-foreground py-20">
                                        <IconLoader2 className="size-10 animate-spin mb-3" />
                                        <p className="text-sm">Video loading...</p>
                                    </div>
                                )}
                            </div>

                            {/* Right: Info Panel */}
                            <div className="flex flex-col gap-5 p-6 overflow-y-auto">
                                {/* Stats Row */}
                                <div className="flex flex-wrap items-center gap-3">
                                    {/* Viral Score */}
                                    <div className={cn(
                                        "flex items-center gap-2 rounded-full px-3 py-1.5",
                                        getScoreBgColor(clip.viralityScore)
                                    )}>
                                        <IconFlame className={cn("size-4", getScoreColor(clip.viralityScore))} />
                                        <span className={cn("font-bold", getScoreColor(clip.viralityScore))}>
                                            {clip.viralityScore}
                                        </span>
                                        <span className="text-muted-foreground text-sm">/100</span>
                                    </div>

                                    {/* Duration */}
                                    <div className="flex items-center gap-1.5 text-muted-foreground">
                                        <IconClock className="size-4" />
                                        <span className="text-sm font-medium">{formatDuration(clip.duration)}</span>
                                    </div>
                                </div>

                                {/* Hooks */}
                                {clip.hooks.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {clip.hooks.map((hook, index) => (
                                            <span
                                                key={index}
                                                className="rounded-full bg-muted px-3 py-1 text-sm"
                                            >
                                                {hook}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Why This Clip is Viral */}
                                {clip.viralityReason && (
                                    <div className="rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IconSparkles className="size-4 text-orange-500" />
                                            <h4 className="font-semibold text-sm">Why This Clip is Viral</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {clip.viralityReason}
                                        </p>
                                    </div>
                                )}

                                {/* Emotions */}
                                {clip.emotions.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <IconMoodSmile className="size-4 text-muted-foreground" />
                                            <h4 className="font-medium text-sm text-muted-foreground">Emotions</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {clip.emotions.map((emotion, index) => (
                                                <span
                                                    key={index}
                                                    className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                                                >
                                                    {emotion}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Recommended Platforms */}
                                {clip.recommendedPlatforms && clip.recommendedPlatforms.length > 0 && (
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <IconShare className="size-4 text-muted-foreground" />
                                            <h4 className="font-medium text-sm text-muted-foreground">Best Platforms</h4>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {clip.recommendedPlatforms.map((platform) => {
                                                const config = PLATFORM_CONFIG[platform];
                                                if (!config) return null;
                                                const Icon = config.icon;
                                                return (
                                                    <div
                                                        key={platform}
                                                        className="flex items-center gap-2 rounded-lg border px-3 py-2"
                                                    >
                                                        <Icon className={cn("size-5", config.color)} />
                                                        <span className="text-sm font-medium">{config.label}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Navigation Bar */}
                        <div className="flex items-center justify-between gap-3 border-t bg-muted/30 px-4 py-3">
                            {/* Previous Button */}
                            <Button
                                variant="outline"
                                onClick={onPrevious}
                                disabled={!hasPrevious}
                                className="gap-2"
                            >
                                <IconChevronLeft className="size-4" />
                                Previous
                            </Button>

                            {/* Center Actions */}
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={handleEdit}
                                    className="gap-2"
                                >
                                    <IconEdit className="size-4" />
                                    Edit
                                </Button>

                                <Button
                                    onClick={handleDownload}
                                    disabled={!clip.storageUrl}
                                >
                                    <IconDownload className="size-4" />
                                    Download
                                    <kbd className="ml-1 rounded bg-blue-500/50 border-primary px-1.5 py-0.5 text-[10px] font-medium">
                                        d
                                    </kbd>
                                </Button>
                            </div>

                            {/* Next Button */}
                            <Button
                                variant="outline"
                                onClick={onNext}
                                disabled={!hasNext}
                                className="gap-2"
                            >
                                Next
                                <IconChevronRight className="size-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

// ============================================================================
// URL State Sync Hook
// ============================================================================

/**
 * useClipModalUrlState - Hook for syncing modal state with URL
 * 
 * Enables deep linking to specific clips via URL search params.
 * When a clip is selected, the URL is updated with ?clip=<clipId>.
 * When the modal is closed, the clip param is removed from the URL.
 * 
 * @validates Requirements 3.1, 3.7, 12.5
 * 
 * @example
 * const { selectedClipId, isOpen, openModal, closeModal } = useClipModalUrlState();
 * 
 * <ClipDetailModal
 *   clipId={selectedClipId}
 *   isOpen={isOpen}
 *   onClose={closeModal}
 *   onEdit={handleEdit}
 * />
 */
export function useClipModalUrlState() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get clip ID from URL
    const selectedClipId = searchParams.get("clip");
    const isOpen = !!selectedClipId;

    // Open modal and update URL
    const openModal = React.useCallback(
        (clipId: string) => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("clip", clipId);
            router.push(`${pathname}?${params.toString()}`, { scroll: false });
        },
        [router, pathname, searchParams]
    );

    // Close modal and update URL
    const closeModal = React.useCallback(() => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete("clip");
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.push(newUrl, { scroll: false });
    }, [router, pathname, searchParams]);

    return {
        selectedClipId,
        isOpen,
        openModal,
        closeModal,
    };
}

export default ClipDetailModal;
