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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    IconX,
    IconFlame,
    IconEdit,
    IconClock,
    IconLoader2,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useClip } from "@/hooks/useClips";
import type { ClipResponse } from "@/lib/api/clips";

// ============================================================================
// Types
// ============================================================================

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
 * ModalHeader - Header section with title and close button
 * 
 * @validates Requirements 3.2
 */
interface ModalHeaderProps {
    title: string;
    onClose: () => void;
}

function ModalHeader({ title, onClose }: ModalHeaderProps) {
    return (
        <DialogHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
                <DialogTitle
                    className="text-lg font-semibold leading-tight line-clamp-2"
                    data-testid="modal-title"
                >
                    {title}
                </DialogTitle>
            </div>
            <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="shrink-0 -mt-1 -mr-2"
                aria-label="Close modal"
                data-testid="modal-close-button"
            >
                <IconX className="size-4" />
            </Button>
        </DialogHeader>
    );
}

/**
 * LoadingState - Skeleton loading state for modal content
 */
function LoadingState() {
    return (
        <div
            className="flex flex-col gap-4"
            role="status"
            aria-label="Loading clip details"
            data-testid="modal-loading"
        >
            {/* Title skeleton */}
            <Skeleton className="h-6 w-3/4" />

            {/* Video player skeleton */}
            <Skeleton className="aspect-video w-full rounded-lg" />

            {/* Metadata skeleton */}
            <div className="flex gap-2">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-16" />
            </div>

            {/* Description skeleton */}
            <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
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
            className="flex flex-col items-center justify-center gap-4 py-8 text-center"
            role="alert"
            data-testid="modal-error"
        >
            <div className="rounded-full bg-destructive/10 p-3">
                <IconX className="size-6 text-destructive" />
            </div>
            <div className="space-y-1">
                <h3 className="font-medium">Failed to load clip</h3>
                <p className="text-sm text-muted-foreground">
                    {error.message || "An error occurred while loading the clip details."}
                </p>
            </div>
            {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry}>
                    Try again
                </Button>
            )}
        </div>
    );
}

/**
 * ClipMetadata - Display clip metadata (duration, score, hooks)
 * 
 * @validates Requirements 3.2, 3.4
 */
interface ClipMetadataProps {
    clip: ClipResponse;
}

function ClipMetadata({ clip }: ClipMetadataProps) {
    const scoreColorClass = getScoreColor(clip.viralityScore);
    const scoreBgClass = getScoreBgColor(clip.viralityScore);

    return (
        <div className="flex flex-wrap items-center gap-2" data-testid="clip-metadata">
            {/* Viral Score */}
            <Badge
                variant="secondary"
                className={cn("flex items-center gap-1", scoreBgClass, scoreColorClass)}
                data-testid="clip-viral-score"
                aria-label={`Virality score: ${clip.viralityScore} out of 100`}
            >
                <IconFlame className="size-3" aria-hidden="true" />
                <span className="font-semibold">{clip.viralityScore}</span>
                <span className="text-muted-foreground">/100</span>
            </Badge>

            {/* Duration */}
            <Badge
                variant="outline"
                className="flex items-center gap-1"
                data-testid="clip-duration"
                aria-label={`Duration: ${formatDuration(clip.duration)}`}
            >
                <IconClock className="size-3" aria-hidden="true" />
                {formatDuration(clip.duration)}
            </Badge>

            {/* Hooks */}
            {clip.hooks.length > 0 && (
                <div className="flex flex-wrap gap-1" data-testid="clip-hooks">
                    {clip.hooks.slice(0, 3).map((hook, index) => (
                        <Badge key={`hook-${index}`} variant="outline" className="text-xs">
                            {hook}
                        </Badge>
                    ))}
                    {clip.hooks.length > 3 && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                            +{clip.hooks.length - 3} more
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}

/**
 * ClipDescription - Display clip description/virality reason
 * 
 * @validates Requirements 3.2
 */
interface ClipDescriptionProps {
    description: string;
}

function ClipDescription({ description }: ClipDescriptionProps) {
    if (!description) return null;

    return (
        <div className="space-y-1" data-testid="clip-description">
            <h4 className="text-sm font-medium text-muted-foreground">Description</h4>
            <p className="text-sm leading-relaxed">{description}</p>
        </div>
    );
}

/**
 * ModalActions - Action buttons (Edit Clip)
 * 
 * @validates Requirements 3.6
 */
interface ModalActionsProps {
    clipId: string;
    onEdit: (clipId: string) => void;
}

function ModalActions({ clipId, onEdit }: ModalActionsProps) {
    return (
        <div className="flex justify-end gap-2 pt-2" data-testid="modal-actions">
            <Button
                onClick={() => onEdit(clipId)}
                className="gap-2"
                data-testid="edit-clip-button"
                aria-label="Edit this clip"
            >
                <IconEdit className="size-4" aria-hidden="true" />
                Edit Clip
            </Button>
        </div>
    );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * ClipDetailModal - Modal for displaying comprehensive clip details
 * 
 * Shows clip title, description, metadata, viral analysis, viral score,
 * and provides an Edit button to navigate to the editing screen.
 * 
 * Uses Radix UI Dialog for accessibility:
 * - Backdrop click to close
 * - Escape key to close
 * - Focus trap within modal
 * - ARIA attributes for screen readers
 * 
 * Supports URL state sync for deep linking via search params.
 * 
 * @validates Requirements 3.1, 3.2, 3.3, 3.4, 3.6, 3.7
 * 
 * @example
 * // Basic usage
 * <ClipDetailModal
 *   clipId={selectedClipId}
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onEdit={(clipId) => router.push(`/clips/${clipId}`)}
 * />
 * 
 * @example
 * // With URL state sync
 * const searchParams = useSearchParams();
 * const clipId = searchParams.get('clip');
 * 
 * <ClipDetailModal
 *   clipId={clipId}
 *   isOpen={!!clipId}
 *   onClose={() => router.push(pathname)}
 *   onEdit={(clipId) => router.push(`/clips/${clipId}`)}
 * />
 */
export function ClipDetailModal({
    clipId,
    isOpen,
    onClose,
    onEdit,
    className,
}: ClipDetailModalProps) {
    // Fetch clip data when modal is open and clipId is provided
    const {
        data: clip,
        isLoading,
        error,
        refetch,
    } = useClip(clipId ?? "");

    // Handle open state change (for backdrop click and Escape key)
    const handleOpenChange = React.useCallback(
        (open: boolean) => {
            if (!open) {
                onClose();
            }
        },
        [onClose]
    );

    // Handle edit button click
    const handleEdit = React.useCallback(() => {
        if (clipId) {
            onEdit(clipId);
        }
    }, [clipId, onEdit]);

    // Don't render if no clipId
    if (!clipId) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent
                className={cn(
                    "max-w-2xl max-h-[90vh] overflow-y-auto",
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
                    <div className="flex flex-col gap-4">
                        {/* Header with title and close button */}
                        <ModalHeader title={clip.title} onClose={onClose} />

                        {/* Hidden description for accessibility */}
                        <DialogDescription className="sr-only" id="clip-modal-description">
                            Details for clip: {clip.title}. Viral score: {clip.viralityScore} out of 100.
                        </DialogDescription>

                        {/* Video Player Placeholder - Will be enhanced in task 2.13 */}
                        <div
                            className="aspect-video w-full rounded-lg bg-muted flex items-center justify-center"
                            data-testid="video-player-placeholder"
                            aria-label="Video player"
                        >
                            {clip.storageUrl ? (
                                <video
                                    src={clip.storageUrl}
                                    poster={clip.thumbnailUrl}
                                    controls
                                    className="w-full h-full rounded-lg object-contain"
                                    aria-label={`Video: ${clip.title}`}
                                >
                                    Your browser does not support the video tag.
                                </video>
                            ) : (
                                <div className="text-center text-muted-foreground">
                                    <IconLoader2 className="size-8 mx-auto mb-2 animate-spin" />
                                    <p className="text-sm">Video loading...</p>
                                </div>
                            )}
                        </div>

                        {/* Metadata (score, duration, hooks) */}
                        <ClipMetadata clip={clip} />

                        {/* Description / Virality Reason */}
                        <ClipDescription description={clip.viralityReason} />

                        {/* Viral Analysis Section - Will be enhanced in task 2.11 */}
                        {clip.viralityReason && (
                            <div
                                className="rounded-lg border bg-muted/50 p-4 space-y-2"
                                data-testid="viral-analysis-section"
                            >
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <IconFlame className="size-4 text-orange-500" />
                                    Why This Clip is Viral
                                </h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {clip.viralityReason}
                                </p>

                                {/* Emotions */}
                                {clip.emotions.length > 0 && (
                                    <div className="flex flex-wrap gap-1 pt-2">
                                        <span className="text-xs text-muted-foreground mr-1">Emotions:</span>
                                        {clip.emotions.map((emotion, index) => (
                                            <Badge
                                                key={`emotion-${index}`}
                                                variant="secondary"
                                                className="text-xs"
                                            >
                                                {emotion}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <ModalActions clipId={clip.id} onEdit={handleEdit} />
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
