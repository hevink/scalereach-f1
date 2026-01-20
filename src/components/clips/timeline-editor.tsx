"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
    IconGripVertical,
    IconClock,
    IconWaveSine,
    IconAlertCircle,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ClipResponse } from "@/lib/api/clips";

// ============================================================================
// Constants
// ============================================================================

/** Minimum clip duration in seconds (Property 11) */
export const MIN_CLIP_DURATION = 5;

/** Maximum clip duration in seconds (Property 11) */
export const MAX_CLIP_DURATION = 180;

// ============================================================================
// Types
// ============================================================================

/**
 * TimelineEditorProps interface
 * 
 * @validates Requirements 10.1, 10.2, 10.3, 10.6, 10.7
 */
export interface TimelineEditorProps {
    /** The viral clip being edited */
    clip: ClipResponse;
    /** Total duration of the source video in seconds */
    videoDuration: number;
    /** Callback when clip boundaries change */
    onChange: (startTime: number, endTime: number) => void;
    /** Optional URL to waveform image for visualization */
    waveformUrl?: string;
    /** Additional className */
    className?: string;
}

/**
 * TimelineState for internal state management
 */
export interface TimelineState {
    startTime: number;
    endTime: number;
    isDragging: boolean;
    dragType: "start" | "end" | null;
}

/**
 * TimelineMarkerProps for draggable markers
 */
interface TimelineMarkerProps {
    /** Position as percentage (0-100) */
    position: number;
    /** Marker type */
    type: "start" | "end";
    /** Whether this marker is being dragged */
    isDragging: boolean;
    /** Callback when drag starts */
    onDragStart: () => void;
    /** Time value in seconds */
    timeValue: number;
    /** Whether the marker is at an invalid position */
    isInvalid?: boolean;
    /** Keyboard event handler for arrow key navigation */
    onKeyDown?: (e: React.KeyboardEvent) => void;
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
 * Convert time in seconds to percentage position on timeline
 */
function timeToPercent(time: number, duration: number): number {
    if (duration <= 0) return 0;
    return Math.max(0, Math.min(100, (time / duration) * 100));
}

/**
 * Convert percentage position to time in seconds
 */
function percentToTime(percent: number, duration: number): number {
    return Math.max(0, Math.min(duration, (percent / 100) * duration));
}

/**
 * Validate clip duration bounds
 * Returns true if duration is valid (between MIN and MAX)
 * 
 * @validates Property 11: Clip Duration Bounds
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
 * 
 * @validates Property 11: Clip Duration Bounds
 */
export function clampToBounds(
    newTime: number,
    otherTime: number,
    type: "start" | "end",
    videoDuration: number
): number {
    // Clamp to video bounds
    let clampedTime = Math.max(0, Math.min(videoDuration, newTime));

    if (type === "start") {
        // Start time must be at least MIN_CLIP_DURATION before end
        const maxStart = otherTime - MIN_CLIP_DURATION;
        // Start time must be at most MAX_CLIP_DURATION before end
        const minStart = Math.max(0, otherTime - MAX_CLIP_DURATION);
        clampedTime = Math.max(minStart, Math.min(maxStart, clampedTime));
    } else {
        // End time must be at least MIN_CLIP_DURATION after start
        const minEnd = otherTime + MIN_CLIP_DURATION;
        // End time must be at most MAX_CLIP_DURATION after start
        const maxEnd = Math.min(videoDuration, otherTime + MAX_CLIP_DURATION);
        clampedTime = Math.max(minEnd, Math.min(maxEnd, clampedTime));
    }

    return clampedTime;
}

// ============================================================================
// TimelineMarker Component
// ============================================================================

/**
 * TimelineMarker - Draggable marker for start/end times
 * 
 * @validates Requirements 10.2, 33.2, 31.5 - Touch device support
 */
function TimelineMarker({
    position,
    type,
    isDragging,
    onDragStart,
    timeValue,
    isInvalid,
    onKeyDown,
}: TimelineMarkerProps) {
    const isStart = type === "start";

    return (
        <TooltipProvider>
            <Tooltip open={isDragging ? true : undefined}>
                <TooltipTrigger asChild>
                    <div
                        className={cn(
                            "absolute top-0 bottom-0 z-10 flex cursor-ew-resize select-none flex-col items-center",
                            // Larger touch target on mobile for better usability
                            // @validates Requirement 31.5 - Timeline usable on touch devices
                            "touch-none",
                            isStart ? "-translate-x-1/2" : "translate-x-1/2"
                        )}
                        style={{ left: `${position}%` }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onDragStart();
                        }}
                        onTouchStart={(e) => {
                            e.preventDefault();
                            onDragStart();
                        }}
                        role="slider"
                        aria-label={`${isStart ? "Start" : "End"} time marker. Use arrow keys for fine adjustment, Shift+arrow for 1 second steps.`}
                        aria-valuenow={timeValue}
                        aria-valuetext={formatTime(timeValue)}
                        tabIndex={0}
                        onKeyDown={onKeyDown}
                    >
                        {/* Marker handle - Larger on touch devices */}
                        {/* @validates Requirement 31.5 - Touch-friendly controls */}
                        <div
                            className={cn(
                                "flex items-center justify-center rounded-t-sm transition-colors",
                                // Larger touch target: 44px minimum recommended for touch
                                "h-7 w-6 sm:h-6 sm:w-5",
                                isStart
                                    ? "bg-green-500 hover:bg-green-600 active:bg-green-700"
                                    : "bg-red-500 hover:bg-red-600 active:bg-red-700",
                                isDragging && "ring-2 ring-white/50 scale-110",
                                isInvalid && "bg-yellow-500 hover:bg-yellow-600"
                            )}
                        >
                            <IconGripVertical className="size-3 sm:size-3 text-white" />
                        </div>
                        {/* Vertical line */}
                        <div
                            className={cn(
                                "w-0.5 flex-1",
                                isStart ? "bg-green-500" : "bg-red-500",
                                isInvalid && "bg-yellow-500"
                            )}
                        />
                    </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                    <div className="flex flex-col gap-1">
                        <span className="font-mono">{formatTime(timeValue)}</span>
                        <span className="text-muted-foreground text-[10px]">
                            ← → fine • Shift+← → 1s
                        </span>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}

// ============================================================================
// WaveformVisualization Component
// ============================================================================

interface WaveformVisualizationProps {
    waveformUrl?: string;
    startPercent: number;
    endPercent: number;
}

/**
 * WaveformVisualization - Displays waveform image when available
 * 
 * @validates Requirements 10.7
 */
function WaveformVisualization({
    waveformUrl,
    startPercent,
    endPercent,
}: WaveformVisualizationProps) {
    if (!waveformUrl) {
        // Show placeholder waveform pattern
        return (
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <div className="flex h-full w-full items-end justify-around gap-px px-1">
                    {Array.from({ length: 50 }).map((_, i) => {
                        const height = 20 + Math.sin(i * 0.5) * 15 + Math.random() * 10;
                        const isInRange =
                            (i / 50) * 100 >= startPercent &&
                            (i / 50) * 100 <= endPercent;
                        return (
                            <div
                                key={i}
                                className={cn(
                                    "w-1 rounded-t-sm transition-colors",
                                    isInRange ? "bg-primary" : "bg-muted-foreground/30"
                                )}
                                style={{ height: `${height}%` }}
                            />
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="absolute inset-0 overflow-hidden">
            <img
                src={waveformUrl}
                alt="Audio waveform"
                className="h-full w-full object-cover opacity-30"
            />
        </div>
    );
}

// ============================================================================
// TimelineEditor Component
// ============================================================================

/**
 * TimelineEditor Component
 * 
 * A visual timeline editor for adjusting clip start and end times.
 * Features draggable markers, waveform visualization, and duration validation.
 * 
 * Features:
 * - Visual timeline with clip segment highlighted (Requirement 10.1)
 * - Draggable start and end markers (Requirement 10.2)
 * - Real-time preview updates during drag (Requirement 10.3)
 * - Duration display with validation (Requirement 10.6)
 * - Waveform visualization when available (Requirement 10.7)
 * - Enforces min 5s and max 180s duration (Property 11)
 * - Keyboard navigation support (Requirement 33.2)
 * - Touch device support (Requirement 31.5)
 * 
 * @example
 * ```tsx
 * <TimelineEditor
 *   clip={clip}
 *   videoDuration={300}
 *   onChange={(start, end) => console.log('New bounds:', start, end)}
 *   waveformUrl="/waveforms/video-123.png"
 * />
 * ```
 * 
 * @validates Requirements 10.1, 10.2, 10.3, 10.6, 10.7
 */
export function TimelineEditor({
    clip,
    videoDuration,
    onChange,
    waveformUrl,
    className,
}: TimelineEditorProps) {
    const timelineRef = React.useRef<HTMLDivElement>(null);

    // Internal state for dragging
    const [state, setState] = React.useState<TimelineState>({
        startTime: clip.startTime,
        endTime: clip.endTime,
        isDragging: false,
        dragType: null,
    });

    // Sync state with clip prop changes
    React.useEffect(() => {
        if (!state.isDragging) {
            setState((prev) => ({
                ...prev,
                startTime: clip.startTime,
                endTime: clip.endTime,
            }));
        }
    }, [clip.startTime, clip.endTime, state.isDragging]);

    // Calculate positions
    const startPercent = timeToPercent(state.startTime, videoDuration);
    const endPercent = timeToPercent(state.endTime, videoDuration);
    const clipWidthPercent = endPercent - startPercent;

    // Validate current duration
    const validation = validateClipDuration(state.startTime, state.endTime);

    // Handle drag start
    const handleDragStart = React.useCallback((type: "start" | "end") => {
        setState((prev) => ({
            ...prev,
            isDragging: true,
            dragType: type,
        }));
    }, []);

    // Handle drag move
    const handleDragMove = React.useCallback(
        (clientX: number) => {
            if (!state.isDragging || !state.dragType || !timelineRef.current) return;

            const rect = timelineRef.current.getBoundingClientRect();
            const percent = ((clientX - rect.left) / rect.width) * 100;
            const newTime = percentToTime(Math.max(0, Math.min(100, percent)), videoDuration);

            setState((prev) => {
                const otherTime = prev.dragType === "start" ? prev.endTime : prev.startTime;
                const clampedTime = clampToBounds(newTime, otherTime, prev.dragType!, videoDuration);

                if (prev.dragType === "start") {
                    return { ...prev, startTime: clampedTime };
                } else {
                    return { ...prev, endTime: clampedTime };
                }
            });
        },
        [state.isDragging, state.dragType, videoDuration]
    );

    // Handle drag end
    const handleDragEnd = React.useCallback(() => {
        if (state.isDragging) {
            // Notify parent of change
            onChange(state.startTime, state.endTime);
        }
        setState((prev) => ({
            ...prev,
            isDragging: false,
            dragType: null,
        }));
    }, [state.isDragging, state.startTime, state.endTime, onChange]);

    // Mouse event handlers
    React.useEffect(() => {
        if (!state.isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            handleDragMove(e.clientX);
        };

        const handleMouseUp = () => {
            handleDragEnd();
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [state.isDragging, handleDragMove, handleDragEnd]);

    // Touch event handlers
    React.useEffect(() => {
        if (!state.isDragging) return;

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleDragMove(e.touches[0].clientX);
            }
        };

        const handleTouchEnd = () => {
            handleDragEnd();
        };

        document.addEventListener("touchmove", handleTouchMove, { passive: false });
        document.addEventListener("touchend", handleTouchEnd);

        return () => {
            document.removeEventListener("touchmove", handleTouchMove);
            document.removeEventListener("touchend", handleTouchEnd);
        };
    }, [state.isDragging, handleDragMove, handleDragEnd]);

    // Keyboard navigation (Requirement 33.2)
    const handleKeyDown = React.useCallback(
        (e: React.KeyboardEvent, type: "start" | "end") => {
            const step = e.shiftKey ? 1 : 0.1; // Shift for coarse adjustment
            let newTime: number;

            switch (e.key) {
                case "ArrowLeft":
                    e.preventDefault();
                    newTime = type === "start" ? state.startTime - step : state.endTime - step;
                    break;
                case "ArrowRight":
                    e.preventDefault();
                    newTime = type === "start" ? state.startTime + step : state.endTime + step;
                    break;
                default:
                    return;
            }

            const otherTime = type === "start" ? state.endTime : state.startTime;
            const clampedTime = clampToBounds(newTime, otherTime, type, videoDuration);

            if (type === "start") {
                setState((prev) => ({ ...prev, startTime: clampedTime }));
                onChange(clampedTime, state.endTime);
            } else {
                setState((prev) => ({ ...prev, endTime: clampedTime }));
                onChange(state.startTime, clampedTime);
            }
        },
        [state.startTime, state.endTime, videoDuration, onChange]
    );

    return (
        <div
            className={cn("flex flex-col gap-2 sm:gap-3", className)}
            data-slot="timeline-editor"
        >
            {/* Duration info bar - Responsive layout */}
            {/* @validates Requirement 31.3 - Mobile-friendly experience */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <IconClock className="size-3" />
                        <span className="font-mono text-xs">
                            {formatTime(validation.duration)}
                        </span>
                    </Badge>
                    {waveformUrl && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                            <IconWaveSine className="size-3" />
                            <span className="text-xs hidden sm:inline">Waveform</span>
                        </Badge>
                    )}
                </div>
                {!validation.isValid && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                        <IconAlertCircle className="size-3" />
                        <span className="text-xs">{validation.error}</span>
                    </Badge>
                )}
            </div>

            {/* Timeline container - Touch-friendly height on mobile */}
            {/* @validates Requirement 31.5 - Timeline usable on touch devices */}
            <div
                ref={timelineRef}
                className={cn(
                    "relative w-full overflow-hidden rounded-lg border bg-muted/50",
                    // Taller on mobile for easier touch interaction
                    "h-20 sm:h-16",
                    state.isDragging && "cursor-ew-resize"
                )}
                role="group"
                aria-label="Timeline editor"
            >
                {/* Waveform visualization */}
                <WaveformVisualization
                    waveformUrl={waveformUrl}
                    startPercent={startPercent}
                    endPercent={endPercent}
                />

                {/* Selected region highlight */}
                <div
                    className={cn(
                        "absolute top-0 bottom-0 transition-all",
                        validation.isValid
                            ? "bg-primary/20 border-y-2 border-primary/40"
                            : "bg-yellow-500/20 border-y-2 border-yellow-500/40"
                    )}
                    style={{
                        left: `${startPercent}%`,
                        width: `${clipWidthPercent}%`,
                    }}
                />

                {/* Start marker */}
                <TimelineMarker
                    position={startPercent}
                    type="start"
                    isDragging={state.isDragging && state.dragType === "start"}
                    onDragStart={() => handleDragStart("start")}
                    timeValue={state.startTime}
                    isInvalid={!validation.isValid}
                    onKeyDown={(e) => handleKeyDown(e, "start")}
                />

                {/* End marker */}
                <TimelineMarker
                    position={endPercent}
                    type="end"
                    isDragging={state.isDragging && state.dragType === "end"}
                    onDragStart={() => handleDragStart("end")}
                    timeValue={state.endTime}
                    isInvalid={!validation.isValid}
                    onKeyDown={(e) => handleKeyDown(e, "end")}
                />

                {/* Time scale markers */}
                <div className="absolute right-0 bottom-0 left-0 flex justify-between px-2 py-1">
                    <span className="font-mono text-muted-foreground text-xs">
                        {formatTime(0)}
                    </span>
                    <span className="font-mono text-muted-foreground text-xs">
                        {formatTime(videoDuration)}
                    </span>
                </div>
            </div>

            {/* Time inputs display - Responsive layout */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs sm:text-sm">Start:</span>
                    <span className="font-mono font-medium text-green-600 dark:text-green-400 text-xs sm:text-sm">
                        {formatTime(state.startTime)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs sm:text-sm">End:</span>
                    <span className="font-mono font-medium text-red-600 dark:text-red-400 text-xs sm:text-sm">
                        {formatTime(state.endTime)}
                    </span>
                </div>
            </div>

            {/* Keyboard shortcuts hint - Hidden on mobile */}
            <p className="hidden sm:block text-center text-muted-foreground text-xs">
                Drag markers to adjust • Arrow keys for fine control • Shift+Arrow for 1s steps
            </p>
            {/* Touch hint - Shown on mobile */}
            <p className="sm:hidden text-center text-muted-foreground text-xs">
                Drag markers to adjust clip boundaries
            </p>
        </div>
    );
}

export default TimelineEditor;
