"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ClipListItem } from "./clip-list-item";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList } from "@/components/ui/skeletons";
import { IconScissors } from "@tabler/icons-react";
import type { ClipResponse } from "@/lib/api/clips";

/**
 * ClipsGridProps interface
 * 
 * @validates Requirements 2.1, 2.2, 2.3
 */
export interface ClipsGridProps {
    /** Array of clips to display */
    clips: ClipResponse[];
    /** Callback when a clip is clicked */
    onClipClick: (clipId: string) => void;
    /** Whether the clips are loading */
    isLoading?: boolean;
    /** Currently selected clip ID */
    selectedClipId?: string;
    /** Callback when favorite button is clicked */
    onFavorite?: (clipId: string) => void;
    /** Callback when delete button is clicked */
    onDelete?: (clipId: string) => void;
    /** ID of clip currently being favorited */
    favoritingClipId?: string;
    /** ID of clip currently being deleted */
    deletingClipId?: string;
    /** Additional className */
    className?: string;
}

/**
 * ClipsGrid - Pure component for displaying clips in a list layout
 * 
 * Displays clips in a table-like row format (NOT card format per requirement 2.2).
 * Each clip shows: thumbnail, title, viral score, duration, hooks.
 * Clicking a clip triggers the onClipClick callback.
 * 
 * This is a pure component that receives clips as props, making it easy to test.
 * 
 * @validates Requirements 2.1, 2.2, 2.3
 * 
 * @example
 * // Basic usage
 * <ClipsGrid
 *   clips={clipsData}
 *   onClipClick={(clipId) => openModal(clipId)}
 * />
 * 
 * @example
 * // With loading state
 * <ClipsGrid
 *   clips={[]}
 *   onClipClick={handleClick}
 *   isLoading={true}
 * />
 */
export function ClipsGrid({
    clips,
    onClipClick,
    isLoading = false,
    selectedClipId,
    onFavorite,
    onDelete,
    favoritingClipId,
    deletingClipId,
    className,
}: ClipsGridProps) {
    // Loading state
    if (isLoading) {
        return (
            <div
                className={cn("flex flex-col gap-3", className)}
                role="status"
                aria-label="Loading clips"
                data-testid="clips-grid-loading"
            >
                <SkeletonList count={5} itemType="card" gap={12} />
            </div>
        );
    }

    // Empty state
    if (!clips || clips.length === 0) {
        return (
            <div className={cn("flex flex-col gap-4", className)} data-testid="clips-grid-empty">
                <EmptyState
                    icon={<IconScissors className="size-6" />}
                    title="No clips found"
                    description="No clips have been generated for this video yet."
                />
            </div>
        );
    }

    // Render clips list
    return (
        <div
            className={cn("flex flex-col gap-3", className)}
            data-testid="clips-grid"
            role="list"
            aria-label="Clips list"
        >
            {clips.map((clip) => (
                <div key={clip.id} role="listitem">
                    <ClipListItem
                        clip={clip}
                        onClick={() => onClipClick(clip.id)}
                        isSelected={selectedClipId === clip.id}
                        onFavorite={onFavorite ? () => onFavorite(clip.id) : undefined}
                        onDelete={onDelete ? () => onDelete(clip.id) : undefined}
                        isFavoriting={favoritingClipId === clip.id}
                        isDeleting={deletingClipId === clip.id}
                    />
                </div>
            ))}
        </div>
    );
}

export default ClipsGrid;
