"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    IconScissors,
    IconHeart,
    IconHeartFilled,
    IconTrash,
    IconLoader2,
    IconClock,
    IconFlame,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ClipResponse } from "@/lib/api/clips";

/**
 * Format duration in seconds to MM:SS format
 */
function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Get color class for virality score badge
 * Green for high (≥70), yellow for medium (40-69), red for low (<40)
 * 
 * @validates Requirements 2.3
 */
function getScoreColor(score: number): string {
    if (score >= 70) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (score >= 40) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    return "bg-red-500/10 text-red-600 dark:text-red-400";
}

/**
 * ClipListItemProps interface
 * 
 * @validates Requirements 2.2, 2.3
 */
export interface ClipListItemProps {
    /** The clip data to display */
    clip: ClipResponse;
    /** Whether this clip is currently selected */
    isSelected?: boolean;
    /** Callback when the clip is clicked (opens modal) */
    onClick: () => void;
    /** Callback when favorite button is clicked */
    onFavorite?: () => void;
    /** Callback when delete button is clicked */
    onDelete?: () => void;
    /** Whether the favorite action is in progress */
    isFavoriting?: boolean;
    /** Whether the delete action is in progress */
    isDeleting?: boolean;
    /** Additional className */
    className?: string;
}

/**
 * ClipListItem - Table-like row component for displaying clip information
 * 
 * Displays clip in a horizontal row layout (NOT card format) with:
 * - Thumbnail
 * - Title
 * - Viral score
 * - Duration
 * - Hooks
 * - Action buttons (favorite, delete)
 * 
 * Designed for use in the VideoClipsPage to display clips in a list/table format.
 * Clicking the row opens the ClipDetailModal.
 * 
 * @validates Requirements 2.2, 2.3
 * 
 * @example
 * // Basic usage
 * <ClipListItem
 *   clip={clipData}
 *   onClick={() => openModal(clipData.id)}
 * />
 * 
 * @example
 * // With all props
 * <ClipListItem
 *   clip={clipData}
 *   isSelected={selectedId === clipData.id}
 *   onClick={() => openModal(clipData.id)}
 *   onFavorite={() => handleFavorite(clipData.id)}
 *   onDelete={() => handleDelete(clipData.id)}
 *   isFavoriting={isFavoritingId === clipData.id}
 *   isDeleting={isDeletingId === clipData.id}
 * />
 */
export function ClipListItem({
    clip,
    isSelected = false,
    onClick,
    onFavorite,
    onDelete,
    isFavoriting = false,
    isDeleting = false,
    className,
}: ClipListItemProps) {
    const scoreColorClass = getScoreColor(clip.viralityScore);

    // Generate placeholder thumbnail if none exists
    const thumbnailUrl = clip.storageUrl || clip.thumbnailUrl;

    return (
        <div
            data-testid="clip-list-item"
            className={cn(
                // Base styles - table-like row layout
                "group flex cursor-pointer items-center gap-4 rounded-lg border bg-card p-3",
                // Hover and transition effects
                "transition-all hover:border-primary/50 hover:shadow-sm",
                // Selected state
                isSelected && "border-primary ring-2 ring-primary/20",
                className
            )}
            onClick={onClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onClick();
                }
            }}
            aria-selected={isSelected}
            aria-label={`Clip: ${clip.title}`}
        >
            {/* Thumbnail Column */}
            <div
                className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-muted"
                data-testid="clip-thumbnail"
            >
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={`Thumbnail for clip: ${clip.title}`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div
                        className="flex h-full w-full items-center justify-center"
                        aria-label="No thumbnail available"
                    >
                        <IconScissors className="size-6 text-muted-foreground/50" aria-hidden="true" />
                    </div>
                )}
                {/* Duration overlay on thumbnail */}
                <span
                    className="absolute right-1 bottom-1 flex items-center gap-0.5 rounded bg-black/70 px-1 text-white text-xs"
                    data-testid="clip-duration"
                    aria-label={`Duration: ${formatDuration(clip.duration)}`}
                >
                    <IconClock className="size-3" aria-hidden="true" />
                    {formatDuration(clip.duration)}
                </span>
            </div>

            {/* Title and Info Column */}
            <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                <h4
                    className="truncate font-medium text-sm"
                    data-testid="clip-title"
                >
                    {clip.title}
                </h4>
                {/* Virality reason preview */}
                {clip.viralityReason && (
                    <p className="line-clamp-1 text-muted-foreground text-xs">
                        {clip.viralityReason}
                    </p>
                )}
                {/* Hooks preview */}
                {clip.hooks.length > 0 && (
                    <div
                        className="flex flex-wrap gap-1"
                        data-testid="clip-hooks"
                    >
                        {clip.hooks.slice(0, 3).map((hook, i) => (
                            <Badge
                                key={`hook-${i}`}
                                variant="outline"
                                className="text-xs"
                            >
                                {hook}
                            </Badge>
                        ))}
                        {clip.hooks.length > 3 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                +{clip.hooks.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
            </div>

            {/* Viral Score Column */}
            <Badge
                variant="secondary"
                className={cn("flex shrink-0 items-center gap-1", scoreColorClass)}
                data-testid="clip-viral-score"
                aria-label={`Virality score: ${clip.viralityScore}`}
            >
                <IconFlame className="size-3" aria-hidden="true" />
                {clip.viralityScore}
            </Badge>

            {/* Favorite Indicator */}
            {clip.favorited && (
                <span aria-label="Favorited" data-testid="clip-favorited">
                    <IconHeartFilled className="size-4 shrink-0 text-red-500" aria-hidden="true" />
                </span>
            )}

            {/* Actions Column */}
            <div className="flex shrink-0 gap-1">
                {onFavorite && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFavorite();
                        }}
                        disabled={isFavoriting}
                        aria-label={clip.favorited ? "Remove from favorites" : "Add to favorites"}
                        data-testid="clip-favorite-button"
                    >
                        {isFavoriting ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : clip.favorited ? (
                            <IconHeartFilled className="size-4 text-red-500" />
                        ) : (
                            <IconHeart className="size-4" />
                        )}
                    </Button>
                )}
                {onDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        disabled={isDeleting}
                        aria-label="Delete clip"
                        data-testid="clip-delete-button"
                    >
                        {isDeleting ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconTrash className="size-4" />
                        )}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default ClipListItem;
