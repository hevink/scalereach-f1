"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * SkeletonProps interface for configurable skeleton components
 * 
 * @validates Requirements 29.1, 29.2, 29.3, 29.4
 */
export interface SkeletonProps {
    /** Variant type for the skeleton */
    variant: "text" | "circular" | "rectangular" | "card";
    /** Width of the skeleton (number for px, string for any CSS value) */
    width?: number | string;
    /** Height of the skeleton (number for px, string for any CSS value) */
    height?: number | string;
    /** Number of skeleton items to render (for text variant) */
    count?: number;
    /** Additional className for styling */
    className?: string;
}

/**
 * Helper to convert width/height to CSS value
 */
function toCssValue(value: number | string | undefined): string | undefined {
    if (value === undefined) return undefined;
    return typeof value === "number" ? `${value}px` : value;
}

/**
 * SkeletonText - Skeleton component for text content
 * 
 * Displays one or more lines of skeleton text that match typical text layouts.
 * The last line is shorter to simulate natural text endings.
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 * 
 * @example
 * // Single line of text
 * <SkeletonText />
 * 
 * @example
 * // Multiple lines of text
 * <SkeletonText lines={3} />
 * 
 * @example
 * // Custom width
 * <SkeletonText width="200px" lines={2} />
 */
export interface SkeletonTextProps {
    /** Number of text lines to display */
    lines?: number;
    /** Width of the skeleton lines */
    width?: number | string;
    /** Height of each line */
    lineHeight?: number | string;
    /** Gap between lines */
    gap?: number | string;
    /** Additional className */
    className?: string;
}

export function SkeletonText({
    lines = 1,
    width,
    lineHeight = 16,
    gap = 8,
    className,
}: SkeletonTextProps) {
    return (
        <div
            className={cn("flex flex-col", className)}
            style={{ gap: toCssValue(gap) }}
            role="status"
            aria-label="Loading text content"
        >
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    className="rounded"
                    style={{
                        width: toCssValue(
                            index === lines - 1 && lines > 1
                                ? typeof width === "number"
                                    ? width * 0.6
                                    : "60%"
                                : width || "100%"
                        ),
                        height: toCssValue(lineHeight),
                    }}
                />
            ))}
        </div>
    );
}

/**
 * SkeletonCard - Skeleton component for video/clip cards
 * 
 * Matches the layout of VideoItem component to prevent layout shift.
 * Includes thumbnail, title, description, badge, and action button placeholders.
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 * 
 * @example
 * // Default video card skeleton
 * <SkeletonCard />
 * 
 * @example
 * // Compact variant
 * <SkeletonCard variant="compact" />
 * 
 * @example
 * // With custom thumbnail size
 * <SkeletonCard thumbnailWidth={160} thumbnailHeight={90} />
 */
export interface SkeletonCardProps {
    /** Card variant - default matches VideoItem, compact is smaller */
    variant?: "default" | "compact" | "grid";
    /** Width of the thumbnail */
    thumbnailWidth?: number | string;
    /** Height of the thumbnail */
    thumbnailHeight?: number | string;
    /** Whether to show the action button skeleton */
    showAction?: boolean;
    /** Whether to show the badge skeleton */
    showBadge?: boolean;
    /** Additional className */
    className?: string;
}

export function SkeletonCard({
    variant = "default",
    thumbnailWidth,
    thumbnailHeight,
    showAction = true,
    showBadge = true,
    className,
}: SkeletonCardProps) {
    // Default dimensions based on variant
    const defaultThumbnailWidth = variant === "compact" ? 80 : variant === "grid" ? "100%" : 112;
    const defaultThumbnailHeight = variant === "compact" ? 45 : variant === "grid" ? 120 : 64;

    const finalThumbnailWidth = thumbnailWidth ?? defaultThumbnailWidth;
    const finalThumbnailHeight = thumbnailHeight ?? defaultThumbnailHeight;

    if (variant === "grid") {
        return (
            <div
                className={cn(
                    "flex flex-col overflow-hidden rounded-lg border bg-card",
                    className
                )}
                role="status"
                aria-label="Loading card content"
            >
                {/* Thumbnail */}
                <Skeleton
                    className="w-full rounded-none"
                    style={{ height: toCssValue(finalThumbnailHeight) }}
                />
                {/* Content */}
                <div className="flex flex-col gap-2 p-4">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="h-3 w-1/2 rounded" />
                    {showBadge && <Skeleton className="mt-1 h-5 w-16 rounded-full" />}
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex items-center gap-4 rounded-lg border p-4",
                variant === "compact" && "gap-3 p-3",
                className
            )}
            role="status"
            aria-label="Loading card content"
        >
            {/* Thumbnail */}
            <Skeleton
                className="shrink-0 rounded"
                style={{
                    width: toCssValue(finalThumbnailWidth),
                    height: toCssValue(finalThumbnailHeight),
                }}
            />

            {/* Info */}
            <div className="flex flex-1 flex-col gap-2 overflow-hidden">
                <Skeleton
                    className="rounded"
                    style={{
                        width: "70%",
                        height: variant === "compact" ? 14 : 16,
                    }}
                />
                <Skeleton
                    className="rounded"
                    style={{
                        width: "40%",
                        height: variant === "compact" ? 12 : 14,
                    }}
                />
            </div>

            {/* Badge */}
            {showBadge && (
                <Skeleton
                    className="shrink-0 rounded-full"
                    style={{
                        width: variant === "compact" ? 60 : 80,
                        height: variant === "compact" ? 20 : 24,
                    }}
                />
            )}

            {/* Action button */}
            {showAction && (
                <Skeleton
                    className="shrink-0 rounded"
                    style={{
                        width: variant === "compact" ? 28 : 32,
                        height: variant === "compact" ? 28 : 32,
                    }}
                />
            )}
        </div>
    );
}

/**
 * SkeletonList - Skeleton component for lists of items
 * 
 * Renders multiple skeleton items to match list layouts.
 * Supports different item types (card, text, custom).
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 * 
 * @example
 * // List of card skeletons
 * <SkeletonList count={5} itemType="card" />
 * 
 * @example
 * // List of text skeletons
 * <SkeletonList count={3} itemType="text" />
 * 
 * @example
 * // Custom render function
 * <SkeletonList count={4} renderItem={(index) => <CustomSkeleton key={index} />} />
 */
export interface SkeletonListProps {
    /** Number of skeleton items to render */
    count?: number;
    /** Type of skeleton item to render */
    itemType?: "card" | "card-compact" | "card-grid" | "text";
    /** Gap between items */
    gap?: number | string;
    /** Custom render function for items */
    renderItem?: (index: number) => React.ReactNode;
    /** Props to pass to card skeletons */
    cardProps?: Omit<SkeletonCardProps, "className">;
    /** Props to pass to text skeletons */
    textProps?: Omit<SkeletonTextProps, "className">;
    /** Layout direction */
    direction?: "vertical" | "horizontal" | "grid";
    /** Grid columns (for grid direction) */
    gridCols?: number;
    /** Additional className */
    className?: string;
}

export function SkeletonList({
    count = 3,
    itemType = "card",
    gap = 12,
    renderItem,
    cardProps,
    textProps,
    direction = "vertical",
    gridCols = 3,
    className,
}: SkeletonListProps) {
    const renderDefaultItem = (index: number) => {
        switch (itemType) {
            case "card":
                return <SkeletonCard key={index} {...cardProps} />;
            case "card-compact":
                return <SkeletonCard key={index} variant="compact" {...cardProps} />;
            case "card-grid":
                return <SkeletonCard key={index} variant="grid" {...cardProps} />;
            case "text":
                return <SkeletonText key={index} lines={2} {...textProps} />;
            default:
                return <SkeletonCard key={index} {...cardProps} />;
        }
    };

    const containerClassName = cn(
        direction === "vertical" && "flex flex-col",
        direction === "horizontal" && "flex flex-row flex-wrap",
        direction === "grid" && "grid",
        className
    );

    const containerStyle: React.CSSProperties = {
        gap: toCssValue(gap),
        ...(direction === "grid" && {
            gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        }),
    };

    return (
        <div
            className={containerClassName}
            style={containerStyle}
            role="status"
            aria-label="Loading list content"
        >
            {Array.from({ length: count }).map((_, index) =>
                renderItem ? renderItem(index) : renderDefaultItem(index)
            )}
        </div>
    );
}

/**
 * SkeletonVideo - Skeleton component for video player placeholder
 * 
 * Displays a video player skeleton with play button and controls.
 * Matches the aspect ratio and layout of the actual video player.
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 * 
 * @example
 * // Default 16:9 video skeleton
 * <SkeletonVideo />
 * 
 * @example
 * // Vertical video skeleton (9:16)
 * <SkeletonVideo aspectRatio="9:16" />
 * 
 * @example
 * // Square video skeleton
 * <SkeletonVideo aspectRatio="1:1" />
 */
export interface SkeletonVideoProps {
    /** Aspect ratio of the video */
    aspectRatio?: "16:9" | "9:16" | "1:1" | "4:3";
    /** Whether to show control bar skeleton */
    showControls?: boolean;
    /** Whether to show play button overlay */
    showPlayButton?: boolean;
    /** Width of the video skeleton */
    width?: number | string;
    /** Additional className */
    className?: string;
}

export function SkeletonVideo({
    aspectRatio = "16:9",
    showControls = true,
    showPlayButton = true,
    width,
    className,
}: SkeletonVideoProps) {
    // Calculate padding-bottom for aspect ratio
    const aspectRatioMap: Record<string, string> = {
        "16:9": "56.25%", // 9/16 * 100
        "9:16": "177.78%", // 16/9 * 100
        "1:1": "100%",
        "4:3": "75%", // 3/4 * 100
    };

    const paddingBottom = aspectRatioMap[aspectRatio] || "56.25%";

    return (
        <div
            className={cn("relative w-full overflow-hidden rounded-lg", className)}
            style={{ width: toCssValue(width) }}
            role="status"
            aria-label="Loading video content"
        >
            {/* Video area with aspect ratio */}
            <div
                className="relative w-full"
                style={{ paddingBottom }}
            >
                <Skeleton className="absolute inset-0 rounded-lg" />

                {/* Play button overlay */}
                {showPlayButton && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Skeleton className="size-16 rounded-full" />
                    </div>
                )}
            </div>

            {/* Controls bar */}
            {showControls && (
                <div className="mt-2 flex items-center gap-3">
                    {/* Play/pause button */}
                    <Skeleton className="size-8 rounded" />
                    {/* Progress bar */}
                    <Skeleton className="h-2 flex-1 rounded-full" />
                    {/* Time display */}
                    <Skeleton className="h-4 w-16 rounded" />
                    {/* Volume */}
                    <Skeleton className="size-8 rounded" />
                    {/* Fullscreen */}
                    <Skeleton className="size-8 rounded" />
                </div>
            )}
        </div>
    );
}

/**
 * SkeletonTranscript - Skeleton component for transcript segments
 * 
 * Displays skeleton for transcript editor with timestamp and text.
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 */
export interface SkeletonTranscriptProps {
    /** Number of transcript segments to show */
    segments?: number;
    /** Additional className */
    className?: string;
}

export function SkeletonTranscript({
    segments = 5,
    className,
}: SkeletonTranscriptProps) {
    return (
        <div
            className={cn("flex flex-col gap-3", className)}
            role="status"
            aria-label="Loading transcript content"
        >
            {Array.from({ length: segments }).map((_, index) => (
                <div key={index} className="flex gap-3 rounded-lg border p-3">
                    {/* Timestamp */}
                    <Skeleton className="h-5 w-14 shrink-0 rounded" />
                    {/* Text content */}
                    <div className="flex flex-1 flex-col gap-1">
                        <Skeleton
                            className="h-4 rounded"
                            style={{ width: `${70 + Math.random() * 30}%` }}
                        />
                        {index % 2 === 0 && (
                            <Skeleton
                                className="h-4 rounded"
                                style={{ width: `${40 + Math.random() * 30}%` }}
                            />
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

/**
 * SkeletonProjectCard - Skeleton for project cards in dashboard
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 */
export interface SkeletonProjectCardProps {
    /** Additional className */
    className?: string;
}

export function SkeletonProjectCard({ className }: SkeletonProjectCardProps) {
    return (
        <div
            className={cn(
                "flex flex-col gap-4 rounded-lg border bg-card p-6",
                className
            )}
            role="status"
            aria-label="Loading project content"
        >
            {/* Header with title and status */}
            <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-5 w-40 rounded" />
                    <Skeleton className="h-4 w-24 rounded" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
            </div>

            {/* Stats */}
            <div className="flex gap-4">
                <div className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                </div>
                <div className="flex items-center gap-2">
                    <Skeleton className="size-4 rounded" />
                    <Skeleton className="h-4 w-16 rounded" />
                </div>
            </div>

            {/* Footer with date */}
            <Skeleton className="h-3 w-32 rounded" />
        </div>
    );
}

/**
 * SkeletonCaptionStyle - Skeleton for caption style panel
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 */
export interface SkeletonCaptionStyleProps {
    /** Additional className */
    className?: string;
}

export function SkeletonCaptionStyle({ className }: SkeletonCaptionStyleProps) {
    return (
        <div
            className={cn("flex flex-col gap-4", className)}
            role="status"
            aria-label="Loading caption style options"
        >
            {/* Template picker */}
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24 rounded" />
                <div className="flex gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-20 rounded" />
                    ))}
                </div>
            </div>

            {/* Font selector */}
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-20 rounded" />
                <Skeleton className="h-10 w-full rounded" />
            </div>

            {/* Font size slider */}
            <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-16 rounded" />
                <Skeleton className="h-6 w-full rounded" />
            </div>

            {/* Color pickers */}
            <div className="flex gap-4">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-20 rounded" />
                    <Skeleton className="size-10 rounded" />
                </div>
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="size-10 rounded" />
                </div>
            </div>
        </div>
    );
}

/**
 * SkeletonVideoListItem - Skeleton for video list items in workspace dashboard
 * 
 * Matches the layout of video cards in the workspace page list view.
 * Includes thumbnail, title, source, type, ratio, and actions.
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 * 
 * @example
 * // Single video list item skeleton
 * <SkeletonVideoListItem />
 */
export interface SkeletonVideoListItemProps {
    /** Additional className */
    className?: string;
}

export function SkeletonVideoListItem({ className }: SkeletonVideoListItemProps) {
    return (
        <div
            className={cn(
                "flex items-center gap-3 px-4 py-3",
                "md:grid md:grid-cols-[80px_1fr_140px_100px] lg:grid-cols-[80px_1fr_140px_140px_100px] xl:grid-cols-[80px_1fr_140px_140px_100px_100px] md:gap-6 md:px-6 md:py-5",
                className
            )}
            role="status"
            aria-label="Loading video"
        >
            {/* Thumbnail - square matching VideoCard */}
            <Skeleton className="shrink-0 size-14 md:size-20 rounded-lg" />

            {/* Description */}
            <div className="flex flex-col justify-center gap-2 min-w-0 flex-1">
                <Skeleton className="h-4 w-3/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
            </div>

            {/* Source - md+ only */}
            <div className="hidden md:flex items-center justify-center">
                <Skeleton className="h-7 w-20 rounded-md" />
            </div>

            {/* Video type - lg+ only */}
            <div className="hidden lg:flex items-center justify-center">
                <Skeleton className="h-4 w-20 rounded" />
            </div>

            {/* Ratio - xl+ only */}
            <div className="hidden xl:flex items-center justify-center">
                <Skeleton className="h-4 w-10 rounded" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-1 md:gap-2 shrink-0">
                <Skeleton className="size-8 rounded" />
                <Skeleton className="hidden md:block size-8 rounded" />
            </div>
        </div>
    );
}

/**
 * SkeletonVideoList - Skeleton for video list in workspace dashboard
 * 
 * Renders multiple SkeletonVideoListItem components in a list/table layout.
 * Matches the workspace page video list layout with column headers.
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 * 
 * @example
 * // Default list with 10 items
 * <SkeletonVideoList />
 * 
 * @example
 * // Custom count
 * <SkeletonVideoList count={6} />
 */
export interface SkeletonVideoListProps {
    /** Number of skeleton items to render */
    count?: number;
    /** Additional className */
    className?: string;
}

export function SkeletonVideoList({ count = 10, className }: SkeletonVideoListProps) {
    return (
        <div
            className={cn("rounded-lg border overflow-hidden", className)}
            role="status"
            aria-label="Loading videos"
        >
            {/* Column Headers - matches VideoGrid exactly */}
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
                {Array.from({ length: count }).map((_, index) => (
                    <SkeletonVideoListItem key={`video-skeleton-${index}`} />
                ))}
            </div>
        </div>
    );
}

/**
 * SkeletonVideoGridItem - Skeleton for video grid items in workspace dashboard
 * 
 * Matches the layout of video cards in the workspace page grid view.
 * Includes thumbnail, duration badge, title, and source type.
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 * 
 * @example
 * // Single video grid item skeleton
 * <SkeletonVideoGridItem />
 * 
 * @example
 * // Multiple items in a grid
 * <div className="grid grid-cols-4 gap-4">
 *   {Array.from({ length: 8 }).map((_, i) => (
 *     <SkeletonVideoGridItem key={i} />
 *   ))}
 * </div>
 */
export interface SkeletonVideoGridItemProps {
    /** Additional className */
    className?: string;
}

export function SkeletonVideoGridItem({ className }: SkeletonVideoGridItemProps) {
    return (
        <div
            className={cn("flex flex-col", className)}
            role="status"
            aria-label="Loading video"
        >
            {/* Thumbnail with badges */}
            <div className="relative aspect-video w-full overflow-hidden rounded-lg">
                <Skeleton className="absolute inset-0" />
                {/* Duration badge skeleton */}
                <div className="absolute bottom-2 left-2">
                    <Skeleton className="h-5 w-12 rounded" />
                </div>
                {/* Time remaining badge skeleton */}
                <div className="absolute bottom-2 right-2">
                    <Skeleton className="h-5 w-16 rounded" />
                </div>
            </div>
            {/* Title and metadata */}
            <div className="mt-2 flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded" />
                    <Skeleton className="mt-1 h-3 w-16 rounded" />
                </div>
                <Skeleton className="size-6 shrink-0 rounded" />
            </div>
        </div>
    );
}

/**
 * SkeletonVideoGrid - Skeleton for video grid in workspace dashboard
 * 
 * Renders multiple SkeletonVideoListItem components in a list/table layout.
 * Matches the workspace page video list layout.
 * 
 * @validates Requirements 29.1, 29.2, 29.4
 * 
 * @example
 * // Default list with 10 items
 * <SkeletonVideoGrid />
 * 
 * @example
 * // Custom count
 * <SkeletonVideoGrid count={6} />
 */
export interface SkeletonVideoGridProps {
    /** Number of skeleton items to render */
    count?: number;
    /** Additional className */
    className?: string;
}

export function SkeletonVideoGrid({ count = 10, className }: SkeletonVideoGridProps) {
    return <SkeletonVideoList count={count} className={className} />;
}

// Re-export the base Skeleton for convenience
export { Skeleton };
