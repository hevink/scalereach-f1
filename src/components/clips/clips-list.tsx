"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    IconScissors,
    IconHeart,
    IconHeartFilled,
    IconTrash,
    IconLoader2,
    IconLayoutGrid,
    IconLayoutList,
    IconClock,
    IconFlame,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonList, SkeletonCard } from "@/components/ui/skeletons";
import { useClipsByVideo, useToggleFavorite, useDeleteClip } from "@/hooks/useClips";
import { toast } from "sonner";
import type { ClipResponse, ClipFilters } from "@/lib/api/clips";

// ============================================================================
// Constants for Virtualization
// ============================================================================

/** Threshold for enabling virtualization (Requirement 35.5) */
const VIRTUALIZATION_THRESHOLD = 50;

/** Number of items to render outside visible area */
const OVERSCAN_COUNT = 3;

/** Estimated height of grid item in pixels */
const GRID_ITEM_HEIGHT = 280;

/** Estimated height of list item in pixels */
const LIST_ITEM_HEIGHT = 88;

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
 * @validates Requirements 6.3
 */
function getScoreColor(score: number): string {
    if (score >= 70) return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (score >= 40) return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
    return "bg-red-500/10 text-red-600 dark:text-red-400";
}

/**
 * ClipsListProps interface
 * 
 * @validates Requirements 6.1, 6.2, 6.5, 6.6, 28.3
 */
export interface ClipsListProps {
    /** ID of the video to display clips for */
    videoId: string;
    /** Callback when a clip is selected */
    onClipSelect: (clipId: string) => void;
    /** Currently selected clip ID */
    selectedClipId?: string;
    /** Optional filters to apply */
    filters?: Partial<ClipFilters>;
    /** View mode - grid or list */
    viewMode?: "grid" | "list";
    /** Callback when view mode changes */
    onViewModeChange?: (mode: "grid" | "list") => void;
    /** Additional className */
    className?: string;
}

/**
 * ClipItemProps for individual clip items
 */
interface ClipItemProps {
    clip: ClipResponse;
    isSelected: boolean;
    onSelect: () => void;
    onFavorite: () => void;
    onDelete: () => void;
    isFavoriting: boolean;
    isDeleting: boolean;
    viewMode: "grid" | "list";
}

/**
 * ClipItem - Individual clip card component
 * 
 * Displays clip thumbnail, title, duration, and virality score
 * Supports favorite toggle and delete actions
 * 
 * @validates Requirements 6.2, 6.3, 6.4, 6.5, 9.1
 */
function ClipItem({
    clip,
    isSelected,
    onSelect,
    onFavorite,
    onDelete,
    isFavoriting,
    isDeleting,
    viewMode,
}: ClipItemProps) {
    const scoreColorClass = getScoreColor(clip.viralityScore);

    // Generate placeholder thumbnail if none exists
    const thumbnailUrl = clip.storageUrl || clip.thumbnailUrl;

    if (viewMode === "grid") {
        return (
            <div
                className={cn(
                    "group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border bg-card transition-all hover:border-primary/50 hover:shadow-md",
                    isSelected && "border-primary ring-2 ring-primary/20"
                )}
                onClick={onSelect}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect();
                    }
                }}
                aria-selected={isSelected}
                aria-label={`Clip: ${clip.title}`}
            >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    {thumbnailUrl ? (
                        <img
                            src={thumbnailUrl}
                            alt={`Thumbnail for clip: ${clip.title}`}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center" aria-label="No thumbnail available">
                            <IconScissors className="size-8 text-muted-foreground/50" aria-hidden="true" />
                        </div>
                    )}
                    {/* Duration overlay */}
                    <span
                        className="absolute right-2 bottom-2 flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-white text-xs"
                        aria-label={`Duration: ${formatDuration(clip.duration)}`}
                    >
                        <IconClock className="size-3" aria-hidden="true" />
                        {formatDuration(clip.duration)}
                    </span>
                    {/* Favorite indicator */}
                    {clip.favorited && (
                        <span className="absolute top-2 left-2" aria-label="Favorited">
                            <IconHeartFilled className="size-4 text-red-500" aria-hidden="true" />
                        </span>
                    )}
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-2 p-3">
                    <h4 className="line-clamp-2 font-medium text-sm leading-tight">
                        {clip.title}
                    </h4>

                    {/* Score badge */}
                    <div className="flex items-center gap-2">
                        <Badge
                            variant="secondary"
                            className={cn("flex items-center gap-1", scoreColorClass)}
                            aria-label={`Virality score: ${clip.viralityScore}`}
                        >
                            <IconFlame className="size-3" aria-hidden="true" />
                            {clip.viralityScore}
                        </Badge>
                    </div>

                    {/* Hooks and emotions preview */}
                    {(clip.hooks.length > 0 || clip.emotions.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                            {clip.hooks.slice(0, 2).map((hook, i) => (
                                <Badge key={`hook-${i}`} variant="outline" className="text-xs">
                                    {hook}
                                </Badge>
                            ))}
                            {clip.emotions.slice(0, 1).map((emotion, i) => (
                                <Badge key={`emotion-${i}`} variant="outline" className="text-xs">
                                    {emotion}
                                </Badge>
                            ))}
                        </div>
                    )}
                </div>

                {/* Actions - visible on hover */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                        variant="secondary"
                        size="icon"
                        className="size-7 bg-background/80 backdrop-blur-sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onFavorite();
                        }}
                        disabled={isFavoriting}
                        aria-label={clip.favorited ? "Remove from favorites" : "Add to favorites"}
                    >
                        {isFavoriting ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : clip.favorited ? (
                            <IconHeartFilled className="size-4 text-red-500" />
                        ) : (
                            <IconHeart className="size-4" />
                        )}
                    </Button>
                    <Button
                        variant="secondary"
                        size="icon"
                        className="size-7 bg-background/80 backdrop-blur-sm hover:bg-destructive hover:text-destructive-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        disabled={isDeleting}
                        aria-label="Delete clip"
                    >
                        {isDeleting ? (
                            <IconLoader2 className="size-4 animate-spin" />
                        ) : (
                            <IconTrash className="size-4" />
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    // List view
    return (
        <div
            className={cn(
                "group flex cursor-pointer items-center gap-4 rounded-lg border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm",
                isSelected && "border-primary ring-2 ring-primary/20"
            )}
            onClick={onSelect}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect();
                }
            }}
            aria-selected={isSelected}
            aria-label={`Clip: ${clip.title}`}
        >
            {/* Thumbnail */}
            <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-muted">
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={`Thumbnail for clip: ${clip.title}`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center" aria-label="No thumbnail available">
                        <IconScissors className="size-6 text-muted-foreground/50" aria-hidden="true" />
                    </div>
                )}
                {/* Duration overlay */}
                <span className="absolute right-1 bottom-1 rounded bg-black/70 px-1 text-white text-xs" aria-label={`Duration: ${formatDuration(clip.duration)}`}>
                    {formatDuration(clip.duration)}
                </span>
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                <h4 className="truncate font-medium text-sm">{clip.title}</h4>
                <p className="line-clamp-1 text-muted-foreground text-xs">
                    {clip.viralityReason}
                </p>
                {/* Hooks preview */}
                {clip.hooks.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {clip.hooks.slice(0, 3).map((hook, i) => (
                            <Badge key={`hook-${i}`} variant="outline" className="text-xs">
                                {hook}
                            </Badge>
                        ))}
                    </div>
                )}
            </div>

            {/* Score badge */}
            <Badge
                variant="secondary"
                className={cn("flex shrink-0 items-center gap-1", scoreColorClass)}
                aria-label={`Virality score: ${clip.viralityScore}`}
            >
                <IconFlame className="size-3" aria-hidden="true" />
                {clip.viralityScore}
            </Badge>

            {/* Favorite indicator */}
            {clip.favorited && (
                <span aria-label="Favorited">
                    <IconHeartFilled className="size-4 shrink-0 text-red-500" aria-hidden="true" />
                </span>
            )}

            {/* Actions */}
            <div className="flex shrink-0 gap-1">
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
                >
                    {isFavoriting ? (
                        <IconLoader2 className="size-4 animate-spin" />
                    ) : clip.favorited ? (
                        <IconHeartFilled className="size-4 text-red-500" />
                    ) : (
                        <IconHeart className="size-4" />
                    )}
                </Button>
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
                >
                    {isDeleting ? (
                        <IconLoader2 className="size-4 animate-spin" />
                    ) : (
                        <IconTrash className="size-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}

// ============================================================================
// Virtualized List Components (Requirement 35.5)
// ============================================================================

interface VirtualizedGridProps {
    clips: ClipResponse[];
    selectedClipId?: string;
    onClipSelect: (clipId: string) => void;
    onFavorite: (clipId: string) => void;
    onDelete: (clipId: string) => void;
    isFavoriting: (clipId: string) => boolean;
    isDeleting: (clipId: string) => boolean;
    containerHeight: number;
}

/**
 * VirtualizedGrid - Renders clips in a virtualized grid for performance
 * Only renders items that are visible in the viewport plus overscan
 * 
 * @validates Requirement 35.5 - Virtualize clips list for >50 items
 */
function VirtualizedGrid({
    clips,
    selectedClipId,
    onClipSelect,
    onFavorite,
    onDelete,
    isFavoriting,
    isDeleting,
    containerHeight,
}: VirtualizedGridProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = React.useState(0);
    const [containerWidth, setContainerWidth] = React.useState(0);

    // Calculate columns based on container width
    const columns = React.useMemo(() => {
        if (containerWidth >= 1024) return 3; // lg
        if (containerWidth >= 640) return 2;  // sm
        return 1;
    }, [containerWidth]);

    // Calculate row count and total height
    const rowCount = Math.ceil(clips.length / columns);
    const totalHeight = rowCount * GRID_ITEM_HEIGHT;

    // Calculate visible range
    const startRow = Math.max(0, Math.floor(scrollTop / GRID_ITEM_HEIGHT) - OVERSCAN_COUNT);
    const endRow = Math.min(
        rowCount - 1,
        Math.ceil((scrollTop + containerHeight) / GRID_ITEM_HEIGHT) + OVERSCAN_COUNT
    );

    // Get visible clips
    const visibleClips = React.useMemo(() => {
        const result: { clip: ClipResponse; index: number; row: number; col: number }[] = [];
        for (let row = startRow; row <= endRow; row++) {
            for (let col = 0; col < columns; col++) {
                const index = row * columns + col;
                if (index < clips.length) {
                    result.push({ clip: clips[index], index, row, col });
                }
            }
        }
        return result;
    }, [clips, startRow, endRow, columns]);

    // Handle scroll
    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Measure container width
    React.useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerWidth(entry.contentRect.width);
            }
        });

        resizeObserver.observe(containerRef.current);
        setContainerWidth(containerRef.current.clientWidth);

        return () => resizeObserver.disconnect();
    }, []);

    const columnWidth = containerWidth / columns;

    return (
        <div
            ref={containerRef}
            className="overflow-auto"
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div className="relative" style={{ height: totalHeight }}>
                {visibleClips.map(({ clip, index, row, col }) => (
                    <div
                        key={clip.id}
                        className="absolute p-2"
                        style={{
                            top: row * GRID_ITEM_HEIGHT,
                            left: col * columnWidth,
                            width: columnWidth,
                            height: GRID_ITEM_HEIGHT,
                        }}
                    >
                        <ClipItem
                            clip={clip}
                            isSelected={selectedClipId === clip.id}
                            onSelect={() => onClipSelect(clip.id)}
                            onFavorite={() => onFavorite(clip.id)}
                            onDelete={() => onDelete(clip.id)}
                            isFavoriting={isFavoriting(clip.id)}
                            isDeleting={isDeleting(clip.id)}
                            viewMode="grid"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

interface VirtualizedListViewProps {
    clips: ClipResponse[];
    selectedClipId?: string;
    onClipSelect: (clipId: string) => void;
    onFavorite: (clipId: string) => void;
    onDelete: (clipId: string) => void;
    isFavoriting: (clipId: string) => boolean;
    isDeleting: (clipId: string) => boolean;
    containerHeight: number;
}

/**
 * VirtualizedListView - Renders clips in a virtualized list for performance
 * 
 * @validates Requirement 35.5 - Virtualize clips list for >50 items
 */
function VirtualizedListView({
    clips,
    selectedClipId,
    onClipSelect,
    onFavorite,
    onDelete,
    isFavoriting,
    isDeleting,
    containerHeight,
}: VirtualizedListViewProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = React.useState(0);

    // Calculate total height
    const totalHeight = clips.length * LIST_ITEM_HEIGHT;

    // Calculate visible range
    const startIndex = Math.max(0, Math.floor(scrollTop / LIST_ITEM_HEIGHT) - OVERSCAN_COUNT);
    const endIndex = Math.min(
        clips.length - 1,
        Math.ceil((scrollTop + containerHeight) / LIST_ITEM_HEIGHT) + OVERSCAN_COUNT
    );

    // Get visible clips
    const visibleClips = React.useMemo(() => {
        return clips.slice(startIndex, endIndex + 1).map((clip, i) => ({
            clip,
            index: startIndex + i,
        }));
    }, [clips, startIndex, endIndex]);

    // Handle scroll
    const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    return (
        <div
            ref={containerRef}
            className="overflow-auto"
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div className="relative" style={{ height: totalHeight }}>
                {visibleClips.map(({ clip, index }) => (
                    <div
                        key={clip.id}
                        className="absolute left-0 right-0 px-1 py-1.5"
                        style={{
                            top: index * LIST_ITEM_HEIGHT,
                            height: LIST_ITEM_HEIGHT,
                        }}
                    >
                        <ClipItem
                            clip={clip}
                            isSelected={selectedClipId === clip.id}
                            onSelect={() => onClipSelect(clip.id)}
                            onFavorite={() => onFavorite(clip.id)}
                            onDelete={() => onDelete(clip.id)}
                            isFavoriting={isFavoriting(clip.id)}
                            isDeleting={isDeleting(clip.id)}
                            viewMode="list"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * ClipsList - Display clips in grid or list view
 * 
 * Shows all viral clips for a video with thumbnail, title, duration, and virality score.
 * Supports clip selection, filtering, and sorting.
 * Implements empty state when no clips are available.
 * 
 * @validates Requirements 6.1, 6.2, 6.5, 6.6, 28.3
 * 
 * @example
 * // Basic usage
 * <ClipsList
 *   videoId="video-123"
 *   onClipSelect={(clipId) => console.log('Selected:', clipId)}
 * />
 * 
 * @example
 * // With selection and filters
 * <ClipsList
 *   videoId="video-123"
 *   onClipSelect={handleSelect}
 *   selectedClipId={selectedId}
 *   filters={{ minScore: 50, sortBy: 'score', sortOrder: 'desc' }}
 *   viewMode="grid"
 * />
 */
export function ClipsList({
    videoId,
    onClipSelect,
    selectedClipId,
    filters,
    viewMode = "grid",
    onViewModeChange,
    className,
}: ClipsListProps) {
    const [internalViewMode, setInternalViewMode] = React.useState<"grid" | "list">(viewMode);

    // Use external viewMode if provided, otherwise use internal state
    const currentViewMode = onViewModeChange ? viewMode : internalViewMode;
    const handleViewModeChange = onViewModeChange || setInternalViewMode;

    // Default filters with descending score sort (Requirement 6.6)
    const defaultFilters: Partial<ClipFilters> = {
        sortBy: "score",
        sortOrder: "desc",
        ...filters,
    };

    const { data: clips, isLoading, error } = useClipsByVideo(videoId, defaultFilters);
    const toggleFavoriteMutation = useToggleFavorite();
    const deleteClipMutation = useDeleteClip();

    const handleFavorite = async (clipId: string) => {
        try {
            await toggleFavoriteMutation.mutateAsync(clipId);
        } catch (error) {
            // Log error for debugging (Requirement 30.5)
            console.error("[ClipsList] Failed to toggle favorite:", {
                clipId,
                error,
                timestamp: new Date().toISOString(),
            });
            // Show toast with error message (Requirement 30.1)
            toast.error("Failed to update favorite status", {
                description: error instanceof Error ? error.message : "Please try again",
            });
        }
    };

    const handleDelete = async (clipId: string) => {
        try {
            await deleteClipMutation.mutateAsync(clipId);
            toast.success("Clip deleted");
        } catch (error) {
            // Log error for debugging (Requirement 30.5)
            console.error("[ClipsList] Failed to delete clip:", {
                clipId,
                error,
                timestamp: new Date().toISOString(),
            });
            // Show toast with error message (Requirement 30.1)
            toast.error("Failed to delete clip", {
                description: error instanceof Error ? error.message : "Please try again",
            });
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className={cn("flex flex-col gap-4", className)}>
                {/* View mode toggle skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                </div>
                {/* Clips skeleton */}
                {currentViewMode === "grid" ? (
                    <SkeletonList
                        count={6}
                        itemType="card-grid"
                        direction="grid"
                        gridCols={3}
                        gap={16}
                    />
                ) : (
                    <SkeletonList count={5} itemType="card" gap={12} />
                )}
            </div>
        );
    }

    // Error state with retry option (Requirement 30.4)
    if (error) {
        // Log error for debugging (Requirement 30.5)
        console.error("[ClipsList] Failed to load clips:", {
            videoId,
            error,
            timestamp: new Date().toISOString(),
        });

        return (
            <div className={cn("flex flex-col gap-4", className)}>
                <EmptyState
                    icon={<IconScissors className="size-6" />}
                    title="Failed to load clips"
                    description={
                        error instanceof Error
                            ? error.message
                            : "There was an error loading the clips. Please try again."
                    }
                    action={{
                        label: "Retry",
                        onClick: () => {
                            // Refetch clips instead of reloading the page
                            window.location.reload();
                        },
                    }}
                />
            </div>
        );
    }

    // Empty state (Requirement 28.3)
    if (!clips || clips.length === 0) {
        return (
            <div className={cn("flex flex-col gap-4", className)}>
                <EmptyState
                    icon={<IconScissors className="size-6" />}
                    title="No clips detected"
                    description="We couldn't find any viral-worthy clips in this video. Try uploading a different video with more engaging content."
                />
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {/* Header with count and view toggle */}
            <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">
                    {clips.length} clip{clips.length === 1 ? "" : "s"} detected
                </p>
                <div className="flex items-center gap-1 rounded-lg border p-1">
                    <Button
                        variant={currentViewMode === "grid" ? "secondary" : "ghost"}
                        size="icon"
                        className="size-7"
                        onClick={() => handleViewModeChange("grid")}
                        aria-label="Grid view"
                        aria-pressed={currentViewMode === "grid"}
                    >
                        <IconLayoutGrid className="size-4" />
                    </Button>
                    <Button
                        variant={currentViewMode === "list" ? "secondary" : "ghost"}
                        size="icon"
                        className="size-7"
                        onClick={() => handleViewModeChange("list")}
                        aria-label="List view"
                        aria-pressed={currentViewMode === "list"}
                    >
                        <IconLayoutList className="size-4" />
                    </Button>
                </div>
            </div>

            {/* Clips grid/list - Use virtualization for large lists (Requirement 35.5) */}
            {clips.length > VIRTUALIZATION_THRESHOLD ? (
                // Virtualized rendering for >50 clips
                currentViewMode === "grid" ? (
                    <VirtualizedGrid
                        clips={clips}
                        selectedClipId={selectedClipId}
                        onClipSelect={onClipSelect}
                        onFavorite={handleFavorite}
                        onDelete={handleDelete}
                        isFavoriting={(clipId) =>
                            toggleFavoriteMutation.isPending &&
                            toggleFavoriteMutation.variables === clipId
                        }
                        isDeleting={(clipId) =>
                            deleteClipMutation.isPending &&
                            deleteClipMutation.variables === clipId
                        }
                        containerHeight={600}
                    />
                ) : (
                    <VirtualizedListView
                        clips={clips}
                        selectedClipId={selectedClipId}
                        onClipSelect={onClipSelect}
                        onFavorite={handleFavorite}
                        onDelete={handleDelete}
                        isFavoriting={(clipId) =>
                            toggleFavoriteMutation.isPending &&
                            toggleFavoriteMutation.variables === clipId
                        }
                        isDeleting={(clipId) =>
                            deleteClipMutation.isPending &&
                            deleteClipMutation.variables === clipId
                        }
                        containerHeight={600}
                    />
                )
            ) : (
                // Standard rendering for ≤50 clips
                currentViewMode === "grid" ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {clips.map((clip) => (
                            <ClipItem
                                key={clip.id}
                                clip={clip}
                                isSelected={selectedClipId === clip.id}
                                onSelect={() => onClipSelect(clip.id)}
                                onFavorite={() => handleFavorite(clip.id)}
                                onDelete={() => handleDelete(clip.id)}
                                isFavoriting={
                                    toggleFavoriteMutation.isPending &&
                                    toggleFavoriteMutation.variables === clip.id
                                }
                                isDeleting={
                                    deleteClipMutation.isPending &&
                                    deleteClipMutation.variables === clip.id
                                }
                                viewMode="grid"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {clips.map((clip) => (
                            <ClipItem
                                key={clip.id}
                                clip={clip}
                                isSelected={selectedClipId === clip.id}
                                onSelect={() => onClipSelect(clip.id)}
                                onFavorite={() => handleFavorite(clip.id)}
                                onDelete={() => handleDelete(clip.id)}
                                isFavoriting={
                                    toggleFavoriteMutation.isPending &&
                                    toggleFavoriteMutation.variables === clip.id
                                }
                                isDeleting={
                                    deleteClipMutation.isPending &&
                                    deleteClipMutation.variables === clip.id
                                }
                                viewMode="list"
                            />
                        ))}
                    </div>
                )
            )}
        </div>
    );
}
