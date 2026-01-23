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
import {
    IconArrowBackUp,
    IconArrowForwardUp,
    IconClock,
    IconDeviceFloppy,
    IconEdit,
    IconLoader,
    IconPlayerPlay,
    IconX,
} from "@tabler/icons-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SkeletonTranscript } from "@/components/ui/skeletons";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
    useTranscriptEditor,
    validateWordTiming,
} from "@/hooks/useTranscript";
import type { TranscriptSegment, TranscriptWord } from "@/lib/api/transcript";

// ============================================================================
// Types
// ============================================================================

export interface TranscriptEditorProps {
    /** Video ID to fetch transcript for */
    videoId: string;
    /** Current playback time in seconds */
    currentTime?: number;
    /** Callback when a segment is clicked (for seek functionality) */
    onSegmentClick?: (timestamp: number) => void;
    /** Whether to highlight the current caption during playback (default: true) */
    highlightCurrent?: boolean;
    /** Whether to auto-scroll to keep the current caption visible (default: true) */
    autoScroll?: boolean;
    /**
     * Callback when a caption is edited (for real-time sync with video overlay)
     * Called with debounced updates (300ms) for optimistic UI updates
     * @validates Requirements 6.3 - Real-time caption edit sync
     */
    onCaptionEdit?: (segmentId: string, newText: string) => void;
}

export interface TranscriptEditorRef {
    /** Scroll to a specific segment by ID */
    scrollToSegment: (segmentId: string) => void;
    /** Scroll to a specific timestamp */
    scrollToTime: (timestamp: number) => void;
    /** Get the current active segment */
    getActiveSegment: () => TranscriptSegment | null;
    /** Trigger undo */
    undo: () => void;
    /** Trigger redo */
    redo: () => void;
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
 * Format seconds to a more precise format for editing (with milliseconds)
 */
function formatTimestampPrecise(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0.000";
    return seconds.toFixed(3);
}

/**
 * Parse a timestamp string to seconds
 */
function parseTimestamp(value: string): number | null {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) return null;
    return num;
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

// ============================================================================
// Constants
// ============================================================================

const VIRTUALIZATION_THRESHOLD = 50;
const OVERSCAN_COUNT = 5;
const ESTIMATED_SEGMENT_HEIGHT = 100; // Slightly taller for editing controls

// ============================================================================
// WordTimingEditor Component
// ============================================================================

interface WordTimingEditorProps {
    word: TranscriptWord;
    wordIndex: number;
    segmentId: string;
    onUpdate: (start: number, end: number) => void;
    onSave: () => void;
    minTime: number;
    maxTime: number;
    isSaving: boolean;
}

function WordTimingEditor({
    word,
    wordIndex,
    segmentId,
    onUpdate,
    onSave,
    minTime,
    maxTime,
    isSaving,
}: WordTimingEditorProps) {
    const [startValue, setStartValue] = useState(formatTimestampPrecise(word.start));
    const [endValue, setEndValue] = useState(formatTimestampPrecise(word.end));
    const [error, setError] = useState<string | null>(null);

    const handleStartChange = (value: string) => {
        setStartValue(value);
        const start = parseTimestamp(value);
        const end = parseTimestamp(endValue);

        if (start !== null && end !== null) {
            if (!validateWordTiming(start, end)) {
                setError("Start time must be less than end time");
            } else if (start < minTime || end > maxTime) {
                setError(`Time must be between ${formatTimestampPrecise(minTime)} and ${formatTimestampPrecise(maxTime)}`);
            } else {
                setError(null);
                onUpdate(start, end);
            }
        }
    };

    const handleEndChange = (value: string) => {
        setEndValue(value);
        const start = parseTimestamp(startValue);
        const end = parseTimestamp(value);

        if (start !== null && end !== null) {
            if (!validateWordTiming(start, end)) {
                setError("Start time must be less than end time");
            } else if (start < minTime || end > maxTime) {
                setError(`Time must be between ${formatTimestampPrecise(minTime)} and ${formatTimestampPrecise(maxTime)}`);
            } else {
                setError(null);
                onUpdate(start, end);
            }
        }
    };

    return (
        <div className="flex flex-col gap-2 min-w-[200px]">
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-10">Start:</span>
                <Input
                    type="text"
                    value={startValue}
                    onChange={(e) => handleStartChange(e.target.value)}
                    className="h-7 text-xs font-mono"
                    placeholder="0.000"
                />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-10">End:</span>
                <Input
                    type="text"
                    value={endValue}
                    onChange={(e) => handleEndChange(e.target.value)}
                    className="h-7 text-xs font-mono"
                    placeholder="0.000"
                />
            </div>
            {error && (
                <p className="text-xs text-destructive">{error}</p>
            )}
            <Button
                size="xs"
                onClick={onSave}
                disabled={!!error || isSaving}
                className="mt-1"
            >
                {isSaving ? (
                    <>
                        <IconLoader className="size-3 animate-spin" />
                        Saving...
                    </>
                ) : (
                    <>
                        <IconDeviceFloppy className="size-3" />
                        Save Timing
                    </>
                )}
            </Button>
        </div>
    );
}

// ============================================================================
// EditableSegment Component
// ============================================================================

interface EditableSegmentProps {
    segment: TranscriptSegment;
    isActive: boolean;
    highlightCurrent: boolean;
    isEditing: boolean;
    onStartEdit: () => void;
    onCancelEdit: () => void;
    onTextChange: (text: string) => void;
    onTextSave: () => void;
    onWordTimingUpdate: (wordIndex: number, start: number, end: number) => void;
    onWordTimingSave: (wordIndex: number) => void;
    onClick: () => void;
    index: number;
    isSaving: boolean;
    editedText: string;
    segmentRef?: React.RefObject<HTMLDivElement | null>;
}

function EditableSegment({
    segment,
    isActive,
    highlightCurrent,
    isEditing,
    onStartEdit,
    onCancelEdit,
    onTextChange,
    onTextSave,
    onWordTimingUpdate,
    onWordTimingSave,
    onClick,
    index,
    isSaving,
    editedText,
    segmentRef,
}: EditableSegmentProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea when entering edit mode
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.select();
        }
    }, [isEditing]);

    // Handle keyboard shortcuts in edit mode
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") {
            onCancelEdit();
        } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            onTextSave();
        }
    };

    // Determine if highlighting should be applied
    const shouldHighlight = isActive && highlightCurrent;

    return (
        <div
            ref={segmentRef}
            className={cn(
                "group flex w-full flex-col gap-2 rounded-lg border p-3 transition-all duration-300",
                shouldHighlight && [
                    "bg-primary/15 border-primary/50 shadow-sm shadow-primary/20",
                    "ring-2 ring-primary/30 ring-offset-1 ring-offset-background",
                    "hover:bg-primary/20 hover:border-primary/60",
                ],
                !shouldHighlight && "bg-card border-border hover:bg-accent/50 hover:border-accent-foreground/20"
            )}
            data-segment-id={segment.id}
            data-active={shouldHighlight ? "true" : "false"}
        >
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2">
                {/* Timestamp Badge - Clickable for seek */}
                <button
                    type="button"
                    onClick={onClick}
                    className={cn(
                        "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium tabular-nums transition-colors",
                        "hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        shouldHighlight
                            ? "bg-primary text-primary-foreground animate-pulse"
                            : "bg-muted text-muted-foreground"
                    )}
                    aria-label={`Seek to ${formatTimestamp(segment.startTime)}`}
                >
                    <IconClock className="size-3" />
                    <span>{formatTimestamp(segment.startTime)}</span>
                </button>

                {/* Duration */}
                <span className="text-xs text-muted-foreground">
                    {formatTimestamp(segment.endTime - segment.startTime)} duration
                </span>

                {/* Edit/Play Controls */}
                <div className="flex items-center gap-1">
                    {shouldHighlight && (
                        <div className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground animate-pulse">
                            <IconPlayerPlay className="size-3" />
                        </div>
                    )}

                    {!isEditing ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onStartEdit();
                                    }}
                                    aria-label="Edit segment"
                                >
                                    <IconEdit className="size-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit text (click to edit)</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onCancelEdit();
                                    }}
                                    aria-label="Cancel editing"
                                >
                                    <IconX className="size-3" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancel (Esc)</TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {isEditing ? (
                <div className="flex flex-col gap-2">
                    {/* Text Editor */}
                    <textarea
                        ref={textareaRef}
                        value={editedText}
                        onChange={(e) => onTextChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={cn(
                            "w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                            "resize-none"
                        )}
                        placeholder="Enter transcript text..."
                        aria-label="Edit transcript text"
                    />

                    {/* Save Button */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                            Press Ctrl+Enter to save, Esc to cancel
                        </span>
                        <Button
                            size="xs"
                            onClick={onTextSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <IconLoader className="size-3 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <IconDeviceFloppy className="size-3" />
                                    Save Text
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Word Timing Controls */}
                    {segment.words && segment.words.length > 0 && (
                        <div className="mt-2 border-t pt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                Word Timing Adjustments
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {segment.words.map((word, wordIndex) => (
                                    <Popover key={`${segment.id}-word-${wordIndex}`}>
                                        <PopoverTrigger
                                            className={cn(
                                                "px-1.5 py-0.5 text-xs rounded border transition-colors",
                                                "hover:bg-accent hover:border-accent-foreground/20",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            )}
                                        >
                                            {word.word}
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-3" align="start">
                                            <div className="mb-2">
                                                <p className="text-sm font-medium">&quot;{word.word}&quot;</p>
                                                <p className="text-xs text-muted-foreground">
                                                    Adjust timing for this word
                                                </p>
                                            </div>
                                            <WordTimingEditor
                                                word={word}
                                                wordIndex={wordIndex}
                                                segmentId={segment.id}
                                                onUpdate={(start, end) => onWordTimingUpdate(wordIndex, start, end)}
                                                onSave={() => onWordTimingSave(wordIndex)}
                                                minTime={segment.startTime}
                                                maxTime={segment.endTime}
                                                isSaving={isSaving}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                /* Display Mode - Click to edit */
                <button
                    type="button"
                    onClick={onStartEdit}
                    className={cn(
                        "text-left text-sm leading-relaxed w-full",
                        "hover:bg-accent/30 rounded px-1 -mx-1 py-0.5 transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        shouldHighlight ? "text-foreground font-semibold" : "text-foreground/80"
                    )}
                    aria-label={`Edit segment ${index + 1}: ${segment.text.slice(0, 50)}...`}
                >
                    {segment.text}
                </button>
            )}
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
// TranscriptEditor Component
// ============================================================================

/**
 * TranscriptEditor component for editing video transcripts
 * 
 * Features:
 * - Inline text editing (Requirement 5.1)
 * - Preserve original word timestamps when modifying text (Requirement 5.2)
 * - Word timing adjustment with validation (Requirement 5.3)
 * - Persist changes immediately via API (Requirement 5.4)
 * - Undo/redo with keyboard shortcuts Ctrl+Z, Ctrl+Shift+Z (Requirement 5.5)
 * - Saving indicator during API calls (Requirement 5.6)
 * - Error toast on save failure (Requirement 5.7)
 * 
 * @example
 * ```tsx
 * <TranscriptEditor
 *   videoId="video-123"
 *   currentTime={45.5}
 *   onSegmentClick={(timestamp) => videoRef.current?.seek(timestamp)}
 * />
 * ```
 */
export const TranscriptEditor = forwardRef<
    TranscriptEditorRef,
    TranscriptEditorProps
>(function TranscriptEditor(
    {
        videoId,
        currentTime = 0,
        onSegmentClick,
        highlightCurrent = true,
        autoScroll = true,
        onCaptionEdit,
    },
    ref
) {
    const containerRef = useRef<HTMLDivElement>(null);
    const activeSegmentRef = useRef<HTMLDivElement>(null);
    const lastActiveSegmentIdRef = useRef<string | null>(null);
    const isUserScrollingRef = useRef(false);
    const userScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Ref for debouncing onCaptionEdit callback (300ms debounce per Requirement 6.3)
    const captionEditDebounceRef = useRef<Record<string, NodeJS.Timeout>>({});

    // Editing state
    const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null);
    const [editedTexts, setEditedTexts] = useState<Record<string, string>>({});
    const [editedWordTimings, setEditedWordTimings] = useState<
        Record<string, { wordIndex: number; start: number; end: number }>
    >({});

    // Use the transcript editor hook with undo/redo support
    const {
        transcript,
        isLoading,
        isError,
        error,
        refetch,
        segments,
        syncWithServer,
        undo,
        redo,
        canUndo,
        canRedo,
        updateSegmentText,
        updateWordTimingLocal,
        saveTranscriptText,
        saveWordTiming,
        isSaving,
        saveError,
    } = useTranscriptEditor(videoId);

    // Sync local state with server data when transcript loads
    useEffect(() => {
        if (transcript?.segments) {
            syncWithServer(transcript.segments);
        }
    }, [transcript?.segments, syncWithServer]);

    // Show error toast on save failure (Requirement 5.7)
    useEffect(() => {
        if (saveError) {
            toast.error("Failed to save changes", {
                description: saveError.message || "Please try again.",
            });
        }
    }, [saveError]);

    // Get display segments (use local state if available, otherwise server data)
    const displaySegments = useMemo(() => {
        return segments.length > 0 ? segments : (transcript?.segments || []);
    }, [segments, transcript?.segments]);

    // Find active segment based on current time
    const activeSegment = useMemo(() => {
        return findActiveSegment(displaySegments, currentTime);
    }, [displaySegments, currentTime]);

    const activeSegmentId = activeSegment?.id || null;

    // Auto-scroll to current caption during playback (Requirement 6.6)
    useEffect(() => {
        // Only auto-scroll if enabled and we have an active segment
        if (!autoScroll || !activeSegmentId || !highlightCurrent) return;

        // Only scroll when the active segment changes (not on every time update)
        if (activeSegmentId === lastActiveSegmentIdRef.current) return;

        // Don't auto-scroll if user is manually scrolling
        if (isUserScrollingRef.current) return;

        lastActiveSegmentIdRef.current = activeSegmentId;

        // Use requestAnimationFrame for smooth scrolling
        requestAnimationFrame(() => {
            if (activeSegmentRef.current) {
                activeSegmentRef.current.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }
        });
    }, [activeSegmentId, autoScroll, highlightCurrent]);

    // Track user scrolling to temporarily disable auto-scroll
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            isUserScrollingRef.current = true;

            // Clear any existing timeout
            if (userScrollTimeoutRef.current) {
                clearTimeout(userScrollTimeoutRef.current);
            }

            // Re-enable auto-scroll after 3 seconds of no user scrolling
            userScrollTimeoutRef.current = setTimeout(() => {
                isUserScrollingRef.current = false;
            }, 3000);
        };

        // Find the scroll area element within the container
        const scrollArea = container.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollArea) {
            scrollArea.addEventListener("scroll", handleScroll, { passive: true });
            return () => {
                scrollArea.removeEventListener("scroll", handleScroll);
                if (userScrollTimeoutRef.current) {
                    clearTimeout(userScrollTimeoutRef.current);
                }
            };
        }
    }, []);

    // Cleanup debounce timeouts on unmount
    useEffect(() => {
        return () => {
            // Clear all pending debounce timeouts for caption edits
            Object.values(captionEditDebounceRef.current).forEach(clearTimeout);
            captionEditDebounceRef.current = {};
        };
    }, []);

    // Keyboard shortcuts for undo/redo (Requirement 5.5)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Only handle if not in an input/textarea
            const target = e.target as HTMLElement;
            const isInInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA";

            // Allow undo/redo even in inputs with Ctrl/Cmd
            if ((e.ctrlKey || e.metaKey) && e.key === "z") {
                if (e.shiftKey) {
                    // Ctrl+Shift+Z = Redo
                    e.preventDefault();
                    redo();
                } else if (!isInInput) {
                    // Ctrl+Z = Undo (only when not in input)
                    e.preventDefault();
                    undo();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo]);

    // Handle segment click for seek
    const handleSegmentClick = useCallback(
        (segment: TranscriptSegment) => {
            onSegmentClick?.(segment.startTime);
        },
        [onSegmentClick]
    );

    // Start editing a segment (Requirement 5.1)
    const handleStartEdit = useCallback((segmentId: string, currentText: string) => {
        setEditingSegmentId(segmentId);
        setEditedTexts((prev) => ({ ...prev, [segmentId]: currentText }));
    }, []);

    // Cancel editing
    const handleCancelEdit = useCallback(() => {
        setEditingSegmentId(null);
    }, []);

    // Update edited text locally
    const handleTextChange = useCallback((segmentId: string, text: string) => {
        setEditedTexts((prev) => ({ ...prev, [segmentId]: text }));

        /**
         * Debounced callback for real-time caption edit sync
         * @validates Requirements 6.3 - Real-time caption edit sync with 300ms debounce
         */
        if (onCaptionEdit) {
            // Clear any existing debounce timeout for this segment
            if (captionEditDebounceRef.current[segmentId]) {
                clearTimeout(captionEditDebounceRef.current[segmentId]);
            }

            // Set new debounced callback (300ms delay)
            captionEditDebounceRef.current[segmentId] = setTimeout(() => {
                onCaptionEdit(segmentId, text);
                // Clean up the timeout reference
                delete captionEditDebounceRef.current[segmentId];
            }, 300);
        }
    }, [onCaptionEdit]);

    // Save text changes (Requirement 5.4)
    const handleTextSave = useCallback(
        async (segmentId: string) => {
            const text = editedTexts[segmentId];
            if (!text) return;

            try {
                // Update local state for undo/redo (Requirement 5.2 - preserves timestamps)
                updateSegmentText(segmentId, text);

                // Persist to server (Requirement 5.4)
                await saveTranscriptText(segmentId, text);

                // Exit edit mode
                setEditingSegmentId(null);

                toast.success("Transcript saved", {
                    description: "Your changes have been saved.",
                });
            } catch (err) {
                // Error toast is handled by the useEffect above (Requirement 5.7)
                console.error("Failed to save transcript:", err);
            }
        },
        [editedTexts, updateSegmentText, saveTranscriptText]
    );

    // Update word timing locally (Requirement 5.3)
    const handleWordTimingUpdate = useCallback(
        (segmentId: string, wordIndex: number, start: number, end: number) => {
            // Validate timing (Requirement 5.3)
            if (!validateWordTiming(start, end)) {
                return;
            }

            setEditedWordTimings((prev) => ({
                ...prev,
                [`${segmentId}-${wordIndex}`]: { wordIndex, start, end },
            }));

            // Update local state for undo/redo
            updateWordTimingLocal(segmentId, wordIndex, start, end);
        },
        [updateWordTimingLocal]
    );

    // Save word timing changes (Requirement 5.4)
    const handleWordTimingSave = useCallback(
        async (segmentId: string, wordIndex: number) => {
            const key = `${segmentId}-${wordIndex}`;
            const timing = editedWordTimings[key];
            if (!timing) return;

            try {
                // Persist to server (Requirement 5.4)
                await saveWordTiming(segmentId, wordIndex, timing.start, timing.end);

                // Clear the edited timing
                setEditedWordTimings((prev) => {
                    const next = { ...prev };
                    delete next[key];
                    return next;
                });

                toast.success("Word timing saved", {
                    description: "The word timing has been updated.",
                });
            } catch (err) {
                // Error toast is handled by the useEffect above (Requirement 5.7)
                console.error("Failed to save word timing:", err);
            }
        },
        [editedWordTimings, saveWordTiming]
    );

    // Imperative handle for external control
    useImperativeHandle(ref, () => ({
        scrollToSegment: (segmentId: string) => {
            const element = containerRef.current?.querySelector(
                `[data-segment-id="${segmentId}"]`
            );
            element?.scrollIntoView({ behavior: "smooth", block: "center" });
        },
        scrollToTime: (timestamp: number) => {
            const segment = findActiveSegment(displaySegments, timestamp);
            if (segment) {
                const element = containerRef.current?.querySelector(
                    `[data-segment-id="${segment.id}"]`
                );
                element?.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        },
        getActiveSegment: () => activeSegment,
        undo,
        redo,
    }));

    // Render loading state
    if (isLoading) {
        return (
            <div className="rounded-lg border bg-card h-[500px]">
                <div className="p-4">
                    <SkeletonTranscript segments={5} />
                </div>
            </div>
        );
    }

    // Render error state
    if (isError) {
        return (
            <div className="rounded-lg border bg-card h-[500px]">
                <TranscriptErrorState
                    error={error as Error}
                    onRetry={() => refetch()}
                />
            </div>
        );
    }

    // Render empty state
    if (displaySegments.length === 0) {
        return (
            <div className="rounded-lg border bg-card h-[500px]">
                <TranscriptEmptyState />
            </div>
        );
    }

    // Render transcript editor
    return (
        <div
            ref={containerRef}
            className="rounded-lg border bg-card overflow-hidden h-[500px] flex flex-col"
            role="region"
            aria-label="Transcript editor"
        >
            {/* Header with controls */}
            <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2 shrink-0">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium">Transcript Editor</h3>
                    <span className="text-xs text-muted-foreground">
                        {displaySegments.length} segment{displaySegments.length !== 1 ? "s" : ""}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    {/* Saving Indicator (Requirement 5.6) */}
                    {isSaving && (
                        <Badge variant="secondary" className="gap-1">
                            <IconLoader className="size-3 animate-spin" />
                            Saving...
                        </Badge>
                    )}

                    {/* Undo/Redo Controls (Requirement 5.5) */}
                    <div className="flex items-center gap-1">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={undo}
                                    disabled={!canUndo}
                                    aria-label="Undo"
                                >
                                    <IconArrowBackUp className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={redo}
                                    disabled={!canRedo}
                                    aria-label="Redo"
                                >
                                    <IconArrowForwardUp className="size-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* Transcript Content */}
            <ScrollArea className="flex-1">
                <div className="flex flex-col gap-2 p-4">
                    {displaySegments.map((segment, index) => (
                        <EditableSegment
                            key={segment.id}
                            segment={segment}
                            isActive={segment.id === activeSegmentId}
                            highlightCurrent={highlightCurrent}
                            isEditing={editingSegmentId === segment.id}
                            onStartEdit={() => handleStartEdit(segment.id, segment.text)}
                            onCancelEdit={handleCancelEdit}
                            onTextChange={(text) => handleTextChange(segment.id, text)}
                            onTextSave={() => handleTextSave(segment.id)}
                            onWordTimingUpdate={(wordIndex, start, end) =>
                                handleWordTimingUpdate(segment.id, wordIndex, start, end)
                            }
                            onWordTimingSave={(wordIndex) =>
                                handleWordTimingSave(segment.id, wordIndex)
                            }
                            onClick={() => handleSegmentClick(segment)}
                            index={index}
                            isSaving={isSaving}
                            editedText={editedTexts[segment.id] ?? segment.text}
                            segmentRef={segment.id === activeSegmentId ? activeSegmentRef : undefined}
                        />
                    ))}
                </div>
            </ScrollArea>

            {/* Keyboard Shortcuts Help */}
            <div className="border-t bg-muted/20 px-4 py-2 text-xs text-muted-foreground shrink-0">
                <span className="font-medium">Shortcuts:</span>{" "}
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+Z</kbd> Undo,{" "}
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+Shift+Z</kbd> Redo,{" "}
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Ctrl+Enter</kbd> Save,{" "}
                <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> Cancel
            </div>
        </div>
    );
});

export default TranscriptEditor;
