"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    IconZoomIn,
    IconZoomOut,
    IconGripVertical,
    IconClock,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Caption } from "@/lib/api/captions";

// ============================================================================
// Constants
// ============================================================================

/** Minimum clip duration in seconds */
export const MIN_CLIP_DURATION = 5;

/** Maximum clip duration in seconds */
export const MAX_CLIP_DURATION = 180;

/** Default zoom level (1 = 100%) */
const DEFAULT_ZOOM_LEVEL = 1;

/** Minimum zoom level */
const MIN_ZOOM_LEVEL = 0.5;

/** Maximum zoom level */
const MAX_ZOOM_LEVEL = 4;

/** Zoom step increment */
const ZOOM_STEP = 0.5;

/** Timeline height in pixels */
const TIMELINE_HEIGHT = 120;

/** Caption track height in pixels */
const CAPTION_TRACK_HEIGHT = 32;

/** Playhead width in pixels */
const PLAYHEAD_WIDTH = 2;

/** Time marker interval in seconds at zoom level 1 */
const BASE_TIME_MARKER_INTERVAL = 10;

// ============================================================================
// Types
// ============================================================================

/**
 * Clip data for the timeline editor
 */
export interface ClipData {
    /** Clip start time in seconds */
    startTime: number;
    /** Clip end time in seconds */
    endTime: number;
    /** Total clip duration in seconds */
    duration: number;
}

/**
 * TimelineEditorProps interface
 * 
 * @validates Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export interface TimelineEditorProps {
    /** Unique identifier for the clip */
    clipId: string;
    /** Clip data with start/end times and duration */
    clipData: ClipData;
    /** Array of captions to display on the timeline */
    captions: Caption[];
    /** Current playback time in seconds */
    currentTime: number;
    /** Callback when user seeks to a new time */
    onSeek: (time: number) => void;
    /** Callback when clip boundaries change */
    onBoundaryChange: (start: number, end: number) => void;
    /** Callback when caption timing changes */
    onCaptionTimingChange?: (captionId: string, start: number, end: number) => void;
    /** Current zoom level (1 = 100%) */
    zoomLevel?: number;
    /** Callback when zoom level changes */
    onZoomChange?: (level: number) => void;
    /** Additional className */
    className?: string;
}

/**
 * Internal state for timeline interactions
 */
export interface TimelineState {
    /** Whether the user is currently dragging */
    isDragging: boolean;
    /** Type of drag operation */
    dragType: "playhead" | "boundary-start" | "boundary-end" | "caption" | null;
    /** ID of the caption being dragged (if applicable) */
    dragCaptionId: string | null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format seconds to MM:SS or HH:MM:SS format
 */
function formatTime(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds)) return "0:00";

    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Convert time in seconds to X position on timeline
 */
function timeToX(time: number, duration: number, width: number, zoomLevel: number): number {
    if (duration <= 0) return 0;
    const effectiveWidth = width * zoomLevel;
    return (time / duration) * effectiveWidth;
}

/**
 * Convert X position to time in seconds
 */
function xToTime(x: number, duration: number, width: number, zoomLevel: number): number {
    if (width <= 0) return 0;
    const effectiveWidth = width * zoomLevel;
    return Math.max(0, Math.min(duration, (x / effectiveWidth) * duration));
}

/**
 * Validate clip duration bounds
 * Returns true if duration is valid (between MIN and MAX)
 */
export function validateClipDuration(startTime: number, endTime: number): {
    isValid: boolean;
    duration: number;
    error?: string;
} {
    const duration = endTime - startTime;

    if (duration < MIN_CLIP_DURATION) {
        return {
            isValid: false,
            duration,
            error: `Minimum duration is ${MIN_CLIP_DURATION} seconds`,
        };
    }

    if (duration > MAX_CLIP_DURATION) {
        return {
            isValid: false,
            duration,
            error: `Maximum duration is ${MAX_CLIP_DURATION} seconds`,
        };
    }

    return { isValid: true, duration };
}

/**
 * Clamp a time value to ensure valid clip duration
 */
export function clampToBounds(
    newTime: number,
    otherTime: number,
    type: "start" | "end",
    videoDuration: number
): number {
    let clampedTime = Math.max(0, Math.min(videoDuration, newTime));

    if (type === "start") {
        const maxStart = otherTime - MIN_CLIP_DURATION;
        const minStart = Math.max(0, otherTime - MAX_CLIP_DURATION);
        clampedTime = Math.max(minStart, Math.min(maxStart, clampedTime));
    } else {
        const minEnd = otherTime + MIN_CLIP_DURATION;
        const maxEnd = Math.min(videoDuration, otherTime + MAX_CLIP_DURATION);
        clampedTime = Math.max(minEnd, Math.min(maxEnd, clampedTime));
    }

    return clampedTime;
}

/**
 * Generate color for caption segment based on index
 */
function getCaptionColor(index: number): string {
    const colors = [
        "hsl(210, 70%, 50%)", // Blue
        "hsl(150, 70%, 40%)", // Green
        "hsl(280, 70%, 50%)", // Purple
        "hsl(30, 70%, 50%)",  // Orange
        "hsl(340, 70%, 50%)", // Pink
    ];
    return colors[index % colors.length];
}

// ============================================================================
// SVG Timeline Components
// ============================================================================

interface TimeMarkersProps {
    duration: number;
    width: number;
    height: number;
    zoomLevel: number;
}

/**
 * TimeMarkers - Renders time scale markers on the timeline
 * @validates Requirement 10.1 - Display visual representation of clip duration
 */
function TimeMarkers({ duration, width, height, zoomLevel }: TimeMarkersProps) {
    const effectiveWidth = width * zoomLevel;
    const interval = BASE_TIME_MARKER_INTERVAL / zoomLevel;
    const markerCount = Math.ceil(duration / interval);
    const markers: React.ReactNode[] = [];

    for (let i = 0; i <= markerCount; i++) {
        const time = i * interval;
        if (time > duration) break;

        const x = timeToX(time, duration, width, zoomLevel);
        const isMajor = i % 2 === 0;

        markers.push(
            <g key={`marker-${i}`}>
                {/* Vertical line */}
                <line
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={isMajor ? 12 : 8}
                    stroke="currentColor"
                    strokeWidth={1}
                    className="text-muted-foreground/50"
                />
                {/* Time label for major markers */}
                {isMajor && (
                    <text
                        x={x}
                        y={22}
                        textAnchor="middle"
                        className="fill-muted-foreground text-[10px] font-mono"
                    >
                        {formatTime(time)}
                    </text>
                )}
            </g>
        );
    }

    return <g data-testid="time-markers">{markers}</g>;
}

interface CaptionSegmentsProps {
    captions: Caption[];
    duration: number;
    width: number;
    zoomLevel: number;
    trackY: number;
    trackHeight: number;
    onCaptionClick?: (captionId: string, startTime: number) => void;
}

/**
 * CaptionSegments - Renders caption blocks on the timeline
 * @validates Requirement 10.2 - Show caption segments as blocks on the timeline
 */
function CaptionSegments({
    captions,
    duration,
    width,
    zoomLevel,
    trackY,
    trackHeight,
    onCaptionClick,
}: CaptionSegmentsProps) {
    return (
        <g data-testid="caption-segments">
            {captions.map((caption, index) => {
                const x = timeToX(caption.startTime, duration, width, zoomLevel);
                const segmentWidth = timeToX(caption.endTime, duration, width, zoomLevel) - x;
                const color = getCaptionColor(index);

                return (
                    <g
                        key={caption.id}
                        className="cursor-pointer"
                        onClick={() => onCaptionClick?.(caption.id, caption.startTime)}
                        role="button"
                        aria-label={`Caption: ${caption.text.substring(0, 30)}...`}
                    >
                        {/* Caption block */}
                        <rect
                            x={x}
                            y={trackY}
                            width={Math.max(segmentWidth, 4)}
                            height={trackHeight}
                            rx={4}
                            fill={color}
                            fillOpacity={0.7}
                            className="transition-opacity hover:opacity-100"
                        />
                        {/* Caption text label (truncated) */}
                        {segmentWidth > 40 && (
                            <text
                                x={x + 4}
                                y={trackY + trackHeight / 2 + 4}
                                className="fill-white text-[10px] pointer-events-none"
                                style={{ fontSize: "10px" }}
                            >
                                {caption.text.length > 20
                                    ? caption.text.substring(0, 20) + "..."
                                    : caption.text}
                            </text>
                        )}
                    </g>
                );
            })}
        </g>
    );
}

interface PlayheadProps {
    currentTime: number;
    duration: number;
    width: number;
    height: number;
    zoomLevel: number;
    isDragging: boolean;
    onDragStart: () => void;
}

/**
 * Playhead - Renders the current playback position indicator
 * @validates Requirement 10.4 - Display current playback position as movable scrubber
 */
function Playhead({
    currentTime,
    duration,
    width,
    height,
    zoomLevel,
    isDragging,
    onDragStart,
}: PlayheadProps) {
    const x = timeToX(currentTime, duration, width, zoomLevel);

    return (
        <g
            data-testid="playhead"
            className="cursor-ew-resize"
            onMouseDown={(e) => {
                e.preventDefault();
                onDragStart();
            }}
            onTouchStart={(e) => {
                e.preventDefault();
                onDragStart();
            }}
        >
            {/* Playhead handle (top triangle) */}
            <polygon
                points={`${x - 8},0 ${x + 8},0 ${x},12`}
                className={cn(
                    "fill-primary transition-colors",
                    isDragging && "fill-primary/80"
                )}
            />
            {/* Playhead line */}
            <line
                x1={x}
                y1={12}
                x2={x}
                y2={height}
                stroke="currentColor"
                strokeWidth={PLAYHEAD_WIDTH}
                className="text-primary"
            />
            {/* Time tooltip during drag */}
            {isDragging && (
                <g>
                    <rect
                        x={x - 25}
                        y={-24}
                        width={50}
                        height={20}
                        rx={4}
                        className="fill-primary"
                    />
                    <text
                        x={x}
                        y={-10}
                        textAnchor="middle"
                        className="fill-primary-foreground text-[11px] font-mono"
                    >
                        {formatTime(currentTime)}
                    </text>
                </g>
            )}
        </g>
    );
}

interface BoundaryHandlesProps {
    startTime: number;
    endTime: number;
    duration: number;
    width: number;
    height: number;
    zoomLevel: number;
    isDraggingStart: boolean;
    isDraggingEnd: boolean;
    onDragStartBoundary: (type: "start" | "end") => void;
}

/**
 * BoundaryHandles - Renders draggable clip start/end handles
 * @validates Requirement 10.3 - Allow users to adjust clip start and end times
 */
function BoundaryHandles({
    startTime,
    endTime,
    duration,
    width,
    height,
    zoomLevel,
    isDraggingStart,
    isDraggingEnd,
    onDragStartBoundary,
}: BoundaryHandlesProps) {
    const startX = timeToX(startTime, duration, width, zoomLevel);
    const endX = timeToX(endTime, duration, width, zoomLevel);

    return (
        <g data-testid="boundary-handles">
            {/* Selected region highlight */}
            <rect
                x={startX}
                y={30}
                width={endX - startX}
                height={height - 30}
                className="fill-primary/10"
            />

            {/* Start boundary handle */}
            <g
                className="cursor-ew-resize"
                onMouseDown={(e) => {
                    e.preventDefault();
                    onDragStartBoundary("start");
                }}
                onTouchStart={(e) => {
                    e.preventDefault();
                    onDragStartBoundary("start");
                }}
            >
                <rect
                    x={startX - 6}
                    y={30}
                    width={12}
                    height={height - 30}
                    className={cn(
                        "fill-green-500/80 transition-colors hover:fill-green-500",
                        isDraggingStart && "fill-green-600"
                    )}
                    rx={2}
                />
                <line
                    x1={startX}
                    y1={30}
                    x2={startX}
                    y2={height}
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-green-500"
                />
            </g>

            {/* End boundary handle */}
            <g
                className="cursor-ew-resize"
                onMouseDown={(e) => {
                    e.preventDefault();
                    onDragStartBoundary("end");
                }}
                onTouchStart={(e) => {
                    e.preventDefault();
                    onDragStartBoundary("end");
                }}
            >
                <rect
                    x={endX - 6}
                    y={30}
                    width={12}
                    height={height - 30}
                    className={cn(
                        "fill-red-500/80 transition-colors hover:fill-red-500",
                        isDraggingEnd && "fill-red-600"
                    )}
                    rx={2}
                />
                <line
                    x1={endX}
                    y1={30}
                    x2={endX}
                    y2={height}
                    stroke="currentColor"
                    strokeWidth={2}
                    className="text-red-500"
                />
            </g>
        </g>
    );
}

// ============================================================================
// Zoom Controls Component
// ============================================================================

interface ZoomControlsProps {
    zoomLevel: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    canZoomIn: boolean;
    canZoomOut: boolean;
}

/**
 * ZoomControls - Zoom in/out buttons for the timeline
 * @validates Requirement 10.6 - Support zoom in and zoom out for precise editing
 */
function ZoomControls({
    zoomLevel,
    onZoomIn,
    onZoomOut,
    canZoomIn,
    canZoomOut,
}: ZoomControlsProps) {
    return (
        <div className="flex items-center gap-1" data-testid="zoom-controls">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={onZoomOut}
                            disabled={!canZoomOut}
                            aria-label="Zoom out"
                        >
                            <IconZoomOut className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom out</TooltipContent>
                </Tooltip>
            </TooltipProvider>

            <Badge variant="secondary" className="font-mono text-xs px-2">
                {Math.round(zoomLevel * 100)}%
            </Badge>

            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={onZoomIn}
                            disabled={!canZoomIn}
                            aria-label="Zoom in"
                        >
                            <IconZoomIn className="size-4" />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Zoom in</TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
    );
}

// ============================================================================
// TimelineEditor Component
// ============================================================================

/**
 * TimelineEditor Component
 * 
 * A visual timeline editor for precise clip and caption timing control.
 * Uses SVG for rendering timeline elements including time markers,
 * caption segments, playhead scrubber, and boundary handles.
 * 
 * Features:
 * - Visual timeline with time markers (Requirement 10.1)
 * - Caption segments as colored blocks (Requirement 10.2)
 * - Draggable clip start/end handles (Requirement 10.3)
 * - Movable playhead scrubber (Requirement 10.4)
 * - Click to seek functionality (Requirement 10.5)
 * - Zoom in/out controls (Requirement 10.6)
 * 
 * @example
 * ```tsx
 * <TimelineEditor
 *   clipId="clip-123"
 *   clipData={{ startTime: 10, endTime: 40, duration: 60 }}
 *   captions={captions}
 *   currentTime={15}
 *   onSeek={(time) => videoRef.current?.seek(time)}
 *   onBoundaryChange={(start, end) => updateClipBoundaries(start, end)}
 *   zoomLevel={1}
 *   onZoomChange={(level) => setZoomLevel(level)}
 * />
 * ```
 * 
 * @validates Requirements 10.1, 10.2, 10.3, 10.4, 10.5, 10.6
 */
export function TimelineEditor({
    clipId,
    clipData,
    captions,
    currentTime,
    onSeek,
    onBoundaryChange,
    onCaptionTimingChange,
    zoomLevel = DEFAULT_ZOOM_LEVEL,
    onZoomChange,
    className,
}: TimelineEditorProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const svgRef = React.useRef<SVGSVGElement>(null);
    const [containerWidth, setContainerWidth] = React.useState(800);

    // Internal state for drag operations
    const [state, setState] = React.useState<TimelineState>({
        isDragging: false,
        dragType: null,
        dragCaptionId: null,
    });

    // Local state for boundaries during drag
    const [localBoundaries, setLocalBoundaries] = React.useState({
        startTime: clipData.startTime,
        endTime: clipData.endTime,
    });

    // Sync local boundaries with props when not dragging
    React.useEffect(() => {
        if (!state.isDragging) {
            setLocalBoundaries({
                startTime: clipData.startTime,
                endTime: clipData.endTime,
            });
        }
    }, [clipData.startTime, clipData.endTime, state.isDragging]);

    // Measure container width
    React.useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.clientWidth);
            }
        };

        updateWidth();
        const resizeObserver = new ResizeObserver(updateWidth);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    // Calculate effective dimensions
    const effectiveWidth = containerWidth * zoomLevel;
    const captionTrackY = 40;

    // ========================================================================
    // Drag Handlers
    // ========================================================================

    const handlePlayheadDragStart = React.useCallback(() => {
        setState({
            isDragging: true,
            dragType: "playhead",
            dragCaptionId: null,
        });
    }, []);

    const handleBoundaryDragStart = React.useCallback((type: "start" | "end") => {
        setState({
            isDragging: true,
            dragType: type === "start" ? "boundary-start" : "boundary-end",
            dragCaptionId: null,
        });
    }, []);

    const handleDragMove = React.useCallback(
        (clientX: number) => {
            if (!state.isDragging || !svgRef.current) return;

            const rect = svgRef.current.getBoundingClientRect();
            const scrollLeft = containerRef.current?.scrollLeft ?? 0;
            const x = clientX - rect.left + scrollLeft;
            const time = xToTime(x, clipData.duration, containerWidth, zoomLevel);

            if (state.dragType === "playhead") {
                onSeek(Math.max(0, Math.min(clipData.duration, time)));
            } else if (state.dragType === "boundary-start") {
                const clampedTime = clampToBounds(
                    time,
                    localBoundaries.endTime,
                    "start",
                    clipData.duration
                );
                setLocalBoundaries((prev) => ({ ...prev, startTime: clampedTime }));
            } else if (state.dragType === "boundary-end") {
                const clampedTime = clampToBounds(
                    time,
                    localBoundaries.startTime,
                    "end",
                    clipData.duration
                );
                setLocalBoundaries((prev) => ({ ...prev, endTime: clampedTime }));
            }
        },
        [state.isDragging, state.dragType, clipData.duration, containerWidth, zoomLevel, onSeek, localBoundaries]
    );

    const handleDragEnd = React.useCallback(() => {
        if (state.isDragging) {
            if (state.dragType === "boundary-start" || state.dragType === "boundary-end") {
                onBoundaryChange(localBoundaries.startTime, localBoundaries.endTime);
            }
        }
        setState({
            isDragging: false,
            dragType: null,
            dragCaptionId: null,
        });
    }, [state.isDragging, state.dragType, localBoundaries, onBoundaryChange]);

    // Global mouse/touch event handlers for drag
    React.useEffect(() => {
        if (!state.isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            handleDragMove(e.clientX);
        };

        const handleMouseUp = () => {
            handleDragEnd();
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleDragMove(e.touches[0].clientX);
            }
        };

        const handleTouchEnd = () => {
            handleDragEnd();
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [state.isDragging, handleDragMove, handleDragEnd]);

    // ========================================================================
    // Click to Seek Handler
    // ========================================================================

    /**
     * Handle click on timeline to seek
     * @validates Requirement 10.5 - Click on timeline to seek
     */
    const handleTimelineClick = React.useCallback(
        (e: React.MouseEvent<SVGSVGElement>) => {
            if (state.isDragging) return;

            const rect = svgRef.current?.getBoundingClientRect();
            if (!rect) return;

            const scrollLeft = containerRef.current?.scrollLeft ?? 0;
            const x = e.clientX - rect.left + scrollLeft;
            const time = xToTime(x, clipData.duration, containerWidth, zoomLevel);

            onSeek(Math.max(0, Math.min(clipData.duration, time)));
        },
        [state.isDragging, clipData.duration, containerWidth, zoomLevel, onSeek]
    );

    // ========================================================================
    // Zoom Handlers
    // ========================================================================

    const handleZoomIn = React.useCallback(() => {
        const newZoom = Math.min(MAX_ZOOM_LEVEL, zoomLevel + ZOOM_STEP);
        onZoomChange?.(newZoom);
    }, [zoomLevel, onZoomChange]);

    const handleZoomOut = React.useCallback(() => {
        const newZoom = Math.max(MIN_ZOOM_LEVEL, zoomLevel - ZOOM_STEP);
        onZoomChange?.(newZoom);
    }, [zoomLevel, onZoomChange]);

    // ========================================================================
    // Caption Click Handler
    // ========================================================================

    const handleCaptionClick = React.useCallback(
        (captionId: string, startTime: number) => {
            onSeek(startTime);
        },
        [onSeek]
    );

    // ========================================================================
    // Validation
    // ========================================================================

    const validation = validateClipDuration(localBoundaries.startTime, localBoundaries.endTime);

    // ========================================================================
    // Render
    // ========================================================================

    return (
        <div
            className={cn(
                "flex flex-col gap-3",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                className
            )}
            data-testid="timeline-editor"
            data-clip-id={clipId}
            tabIndex={0}
            role="region"
            aria-label="Timeline editor for clip editing"
        >
            {/* Header with duration info and zoom controls */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <IconClock className="size-3" />
                        <span className="font-mono text-xs">
                            {formatTime(validation.duration)}
                        </span>
                    </Badge>
                    <span className="text-muted-foreground text-xs">
                        {formatTime(currentTime)} / {formatTime(clipData.duration)}
                    </span>
                </div>

                {onZoomChange && (
                    <ZoomControls
                        zoomLevel={zoomLevel}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        canZoomIn={zoomLevel < MAX_ZOOM_LEVEL}
                        canZoomOut={zoomLevel > MIN_ZOOM_LEVEL}
                    />
                )}
            </div>

            {/* Timeline container with horizontal scroll */}
            <div
                ref={containerRef}
                className={cn(
                    "relative overflow-x-auto overflow-y-hidden rounded-lg border bg-muted/30",
                    state.isDragging && "cursor-ew-resize"
                )}
                style={{ height: TIMELINE_HEIGHT + 8 }}
            >
                <svg
                    ref={svgRef}
                    width={effectiveWidth}
                    height={TIMELINE_HEIGHT}
                    className="block"
                    onClick={handleTimelineClick}
                    role="application"
                    aria-label="Timeline editor. Click to seek, drag handles to adjust boundaries."
                >
                    {/* Background */}
                    <rect
                        x={0}
                        y={0}
                        width={effectiveWidth}
                        height={TIMELINE_HEIGHT}
                        className="fill-transparent"
                    />

                    {/* Time markers */}
                    <TimeMarkers
                        duration={clipData.duration}
                        width={containerWidth}
                        height={TIMELINE_HEIGHT}
                        zoomLevel={zoomLevel}
                    />

                    {/* Caption segments */}
                    <CaptionSegments
                        captions={captions}
                        duration={clipData.duration}
                        width={containerWidth}
                        zoomLevel={zoomLevel}
                        trackY={captionTrackY}
                        trackHeight={CAPTION_TRACK_HEIGHT}
                        onCaptionClick={handleCaptionClick}
                    />

                    {/* Boundary handles */}
                    <BoundaryHandles
                        startTime={localBoundaries.startTime}
                        endTime={localBoundaries.endTime}
                        duration={clipData.duration}
                        width={containerWidth}
                        height={TIMELINE_HEIGHT}
                        zoomLevel={zoomLevel}
                        isDraggingStart={state.dragType === "boundary-start"}
                        isDraggingEnd={state.dragType === "boundary-end"}
                        onDragStartBoundary={handleBoundaryDragStart}
                    />

                    {/* Playhead */}
                    <Playhead
                        currentTime={currentTime}
                        duration={clipData.duration}
                        width={containerWidth}
                        height={TIMELINE_HEIGHT}
                        zoomLevel={zoomLevel}
                        isDragging={state.dragType === "playhead"}
                        onDragStart={handlePlayheadDragStart}
                    />
                </svg>
            </div>

            {/* Time display footer */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">Start:</span>
                        <span className="font-mono font-medium text-green-600 dark:text-green-400 text-xs">
                            {formatTime(localBoundaries.startTime)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">End:</span>
                        <span className="font-mono font-medium text-red-600 dark:text-red-400 text-xs">
                            {formatTime(localBoundaries.endTime)}
                        </span>
                    </div>
                </div>
                {!validation.isValid && (
                    <span className="text-destructive text-xs">{validation.error}</span>
                )}
            </div>

            {/* Keyboard shortcuts hint */}
            <p className="hidden sm:block text-center text-muted-foreground text-xs">
                Click timeline to seek • Drag playhead or boundary handles • Use zoom controls for precision
            </p>
        </div>
    );
}

export default TimelineEditor;
