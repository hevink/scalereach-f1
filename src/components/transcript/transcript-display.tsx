"use client";

import {
    forwardRef,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from "react";
import { IconClock, IconPlayerPlay } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonTranscript } from "@/components/ui/skeletons";
import { useTranscript } from "@/hooks/useTranscript";
import type { TranscriptSegment } from "@/lib/api/transcript";

// ============================================================================
// Types
// ============================================================================

export interface TranscriptDisplayProps {
    /** Video ID to fetch transcript for */
    videoId: string;
    /** Current playback time in seconds */
    currentTime?: number;
    /** Callback when a segment is clicked (for seek functionality) */
    onSegmentClick?: (timestamp: number) => void;
    /** Whether the transcript is editable (reserved for future use) */
    editable?: boolean;
    /** Additional class names */
    className?: string;
    /** Height of the transcript container */
    height?: number | string;
    /** Whether to auto-scroll to the current segment */
    autoScroll?: boolean;
}

export interface TranscriptDisplayRef {
    /** Scroll to a specific segment by ID */
    scrollToSegment: (segmentId: string) => void;
    /** Scroll to a specific timestamp */
    scrollToTime: (timestamp: number) => void;
    /** Get the current active segment */
    getActiveSegment: () => TranscriptSegment | null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format seconds to MM:SS or HH:MM:SS format
 */
function formatTimestamp(seconds: number): string {
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
 * Find the active segment based on current playback time
 */
function findActiveSegment(
    segments: TranscriptSegment[],
    currentTime: number
): TranscriptSegment | null {
    return (
        segments.find(
            (segment) =>
                currentTime >= segment.startTime && currentTime < segment.endTime
        ) || null
    );
}

/**
 * Find the index of the active segment
 */
function findActiveSegmentIndex(
    segments: TranscriptSegment[],
    currentTime: number
): number {
    return segments.findIndex(
        (segment) =>
            currentTime >= segment.startTime && currentTime < segment.endTime
    );
}

// ============================================================================
// Constants
// ============================================================================

const VIRTUALIZATION_THRESHOLD = 50; // Enable virtualization for more than 50 segments
const OVERSCAN_COUNT = 5; // Number of items to render outside the visible area
const ESTIMATED_SEGMENT_HEIGHT = 72; // Estimated height of each segment in pixels

// ============================================================================
// TranscriptSegmentItem Component
// ============================================================================

interface TranscriptSegmentItemProps {
    segment: TranscriptSegment;
    isActive: boolean;
    onClick: () => void;
    index: number;
}

function TranscriptSegmentItem({
    segment,
    isActive,
    onClick,
    index,
}: TranscriptSegmentItemProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "group flex w-full gap-3 rounded-lg border p-3 text-left transition-all duration-200",
                "hover:bg-accent/50 hover:border-accent-foreground/20",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                isActive && [
                    "bg-primary/10 border-primary/30",
                    "hover:bg-primary/15 hover:border-primary/40",
                ],
                !isActive && "bg-card border-border"
            )}
            aria-label={`Segment ${index + 1}: ${segment.text.slice(0, 50)}... Click to seek to ${formatTimestamp(segment.startTime)}`}
            aria-current={isActive ? "true" : undefined}
            data-segment-id={segment.id}
        >
            {/* Timestamp Badge */}
            <div
                className={cn(
                    "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium tabular-nums transition-colors",
                    isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-muted/80"
                )}
            >
                <IconClock className="size-3" />
                <span>{formatTimestamp(segment.startTime)}</span>
            </div>

            {/* Segment Text */}
            <div className="flex flex-1 flex-col gap-1 overflow-hidden">
                <p
                    className={cn(
                        "text-sm leading-relaxed",
                        isActive ? "text-foreground font-medium" : "text-foreground/80"
                    )}
                >
                    {segment.text}
                </p>

                {/* Duration indicator */}
                <span className="text-xs text-muted-foreground">
                    {formatTimestamp(segment.endTime - segment.startTime)} duration
                </span>
            </div>

            {/* Play indicator for active segment */}
            {isActive && (
                <div className="flex shrink-0 items-center">
                    <div className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <IconPlayerPlay className="size-3" />
                    </div>
                </div>
            )}
        </button>
    );
}

// ============================================================================
// VirtualizedList Component
// ============================================================================

interface VirtualizedListProps {
    segments: TranscriptSegment[];
    activeSegmentId: string | null;
    onSegmentClick: (segment: TranscriptSegment) => void;
    containerHeight: number;
    autoScroll: boolean;
    currentTime: number;
}

function VirtualizedList({
    segments,
    activeSegmentId,
    onSegmentClick,
    containerHeight,
    autoScroll,
    currentTime,
}: VirtualizedListProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scrollTop, setScrollTop] = useState(0);
    const lastAutoScrollTime = useRef<number>(0);

    // Calculate visible range
    const totalHeight = segments.length * ESTIMATED_SEGMENT_HEIGHT;
    const startIndex = Math.max(
        0,
        Math.floor(scrollTop / ESTIMATED_SEGMENT_HEIGHT) - OVERSCAN_COUNT
    );
    const endIndex = Math.min(
        segments.length - 1,
        Math.ceil((scrollTop + containerHeight) / ESTIMATED_SEGMENT_HEIGHT) +
        OVERSCAN_COUNT
    );

    const visibleSegments = useMemo(() => {
        return segments.slice(startIndex, endIndex + 1).map((segment, index) => ({
            segment,
            index: startIndex + index,
        }));
    }, [segments, startIndex, endIndex]);

    // Handle scroll
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    }, []);

    // Auto-scroll to active segment
    useEffect(() => {
        if (!autoScroll || !activeSegmentId || !containerRef.current) return;

        // Debounce auto-scroll to prevent too frequent updates
        const now = Date.now();
        if (now - lastAutoScrollTime.current < 500) return;

        const activeIndex = segments.findIndex((s) => s.id === activeSegmentId);
        if (activeIndex === -1) return;

        const targetScrollTop = activeIndex * ESTIMATED_SEGMENT_HEIGHT;
        const currentScrollTop = containerRef.current.scrollTop;
        const viewportMiddle = containerHeight / 2;

        // Only scroll if the active segment is outside the visible area
        if (
            targetScrollTop < currentScrollTop ||
            targetScrollTop > currentScrollTop + containerHeight - ESTIMATED_SEGMENT_HEIGHT
        ) {
            containerRef.current.scrollTo({
                top: Math.max(0, targetScrollTop - viewportMiddle + ESTIMATED_SEGMENT_HEIGHT / 2),
                behavior: "smooth",
            });
            lastAutoScrollTime.current = now;
        }
    }, [activeSegmentId, autoScroll, containerHeight, segments]);

    return (
        <div
            ref={containerRef}
            className="h-full overflow-auto"
            onScroll={handleScroll}
            style={{ height: containerHeight }}
        >
            <div
                className="relative"
                style={{ height: totalHeight }}
            >
                {visibleSegments.map(({ segment, index }) => (
                    <div
                        key={segment.id}
                        className="absolute left-0 right-0 px-1"
                        style={{
                            top: index * ESTIMATED_SEGMENT_HEIGHT,
                            height: ESTIMATED_SEGMENT_HEIGHT,
                        }}
                    >
                        <TranscriptSegmentItem
                            segment={segment}
                            isActive={segment.id === activeSegmentId}
                            onClick={() => onSegmentClick(segment)}
                            index={index}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// SimpleList Component (for smaller lists)
// ============================================================================

interface SimpleListProps {
    segments: TranscriptSegment[];
    activeSegmentId: string | null;
    onSegmentClick: (segment: TranscriptSegment) => void;
    autoScroll: boolean;
}

function SimpleList({
    segments,
    activeSegmentId,
    onSegmentClick,
    autoScroll,
}: SimpleListProps) {
    const activeRef = useRef<HTMLDivElement>(null);
    const lastAutoScrollTime = useRef<number>(0);

    // Auto-scroll to active segment
    useEffect(() => {
        if (!autoScroll || !activeSegmentId || !activeRef.current) return;

        // Debounce auto-scroll
        const now = Date.now();
        if (now - lastAutoScrollTime.current < 500) return;

        activeRef.current.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
        lastAutoScrollTime.current = now;
    }, [activeSegmentId, autoScroll]);

    return (
        <div className="flex flex-col gap-2 p-1">
            {segments.map((segment, index) => (
                <div
                    key={segment.id}
                    ref={segment.id === activeSegmentId ? activeRef : undefined}
                >
                    <TranscriptSegmentItem
                        segment={segment}
                        isActive={segment.id === activeSegmentId}
                        onClick={() => onSegmentClick(segment)}
                        index={index}
                    />
                </div>
            ))}
        </div>
    );
}

// ============================================================================
// Empty State Component
// ============================================================================

function TranscriptEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <IconClock className="size-6 text-muted-foreground" />
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-medium">No transcript available</h3>
                <p className="text-xs text-muted-foreground">
                    The transcript will appear here once the video is processed.
                </p>
            </div>
        </div>
    );
}

// ============================================================================
// Error State Component
// ============================================================================

interface TranscriptErrorStateProps {
    error: Error | null;
    onRetry?: () => void;
}

function TranscriptErrorState({ error, onRetry }: TranscriptErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
                <IconClock className="size-6 text-destructive" />
            </div>
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-destructive">
                    Failed to load transcript
                </h3>
                <p className="text-xs text-muted-foreground">
                    {error?.message || "An error occurred while loading the transcript."}
                </p>
            </div>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="text-sm text-primary hover:underline"
                >
                    Try again
                </button>
            )}
        </div>
    );
}

// ============================================================================
// TranscriptDisplay Component
// ============================================================================

/**
 * TranscriptDisplay component for displaying video transcripts
 * 
 * Features:
 * - Display transcript segments with timestamps (Requirement 4.1, 4.2)
 * - Click-to-seek functionality (Requirement 4.3)
 * - Highlight current segment during playback (Requirement 4.4)
 * - Virtualized scrolling for long transcripts (Requirement 4.5)
 * 
 * @example
 * ```tsx
 * <TranscriptDisplay
 *   videoId="video-123"
 *   currentTime={45.5}
 *   onSegmentClick={(timestamp) => videoRef.current?.seek(timestamp)}
 * />
 * ```
 */
export const TranscriptDisplay = forwardRef<
    TranscriptDisplayRef,
    TranscriptDisplayProps
>(function TranscriptDisplay(
    {
        videoId,
        currentTime = 0,
        onSegmentClick,
        editable = false,
        className,
        height = 400,
        autoScroll = true,
    },
    ref
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerHeight, setContainerHeight] = useState(
        typeof height === "number" ? height : 400
    );

    // Fetch transcript data
    const {
        data: transcript,
        isLoading,
        isError,
        error,
        refetch,
    } = useTranscript(videoId);

    // Get segments from transcript
    const segments = useMemo(() => {
        return transcript?.segments || [];
    }, [transcript]);

    // Find active segment based on current time
    const activeSegment = useMemo(() => {
        return findActiveSegment(segments, currentTime);
    }, [segments, currentTime]);

    const activeSegmentId = activeSegment?.id || null;

    // Determine if we should use virtualization
    const useVirtualization = segments.length > VIRTUALIZATION_THRESHOLD;

    // Handle segment click
    const handleSegmentClick = useCallback(
        (segment: TranscriptSegment) => {
            onSegmentClick?.(segment.startTime);
        },
        [onSegmentClick]
    );

    // Measure container height
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerHeight(entry.contentRect.height);
            }
        });

        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // Imperative handle for external control
    useImperativeHandle(ref, () => ({
        scrollToSegment: (segmentId: string) => {
            const element = containerRef.current?.querySelector(
                `[data-segment-id="${segmentId}"]`
            );
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        scrollToTime: (timestamp: number) => {
            const segment = findActiveSegment(segments, timestamp);
            if (segment) {
                const element = containerRef.current?.querySelector(
                    `[data-segment-id="${segment.id}"]`
                );
                element?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        },
        getActiveSegment: () => activeSegment,
    }));

    // Render loading state
    if (isLoading) {
        return (
            <div
                className={cn("rounded-lg border bg-card", className)}
                style={{ height }}
            >
                <div className="p-4">
                    <SkeletonTranscript segments={5} />
                </div>
            </div>
        );
    }

    // Render error state
    if (isError) {
        return (
            <div
                className={cn("rounded-lg border bg-card", className)}
                style={{ height }}
            >
                <TranscriptErrorState
                    error={error as Error}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    // Render empty state
    if (segments.length === 0) {
        return (
            <div
                className={cn("rounded-lg border bg-card", className)}
                style={{ height }}
            >
                <TranscriptEmptyState />
            </div>
        );
    }

    // Render transcript
    return (
        <div
            ref={containerRef}
            className={cn("rounded-lg border bg-card overflow-hidden", className)}
            style={{ height }}
            role="region"
            aria-label="Video transcript"
        >
            {/* Header */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2">
                <h3 className="text-sm font-medium">Transcript</h3>
                <span className="text-xs text-muted-foreground">
                    {segments.length} segment{segments.length !== 1 ? "s" : ""}
                </span>
            </div>

            {/* Transcript Content */}
            {useVirtualization ? (
                <VirtualizedList
                    segments={segments}
                    activeSegmentId={activeSegmentId}
                    onSegmentClick={handleSegmentClick}
                    containerHeight={containerHeight - 41} // Subtract header height
                    autoScroll={autoScroll}
                    currentTime={currentTime}
                />
            ) : (
                <ScrollArea className="h-[calc(100%-41px)]">
                    <SimpleList
                        segments={segments}
                        activeSegmentId={activeSegmentId}
                        onSegmentClick={handleSegmentClick}
                        autoScroll={autoScroll}
                    />
                </ScrollArea>
            )}
        </div>
    );
});

export default TranscriptDisplay;
