"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconClock, IconEdit, IconCheck, IconX } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TranscriptSegment, TranscriptWord } from "@/lib/api/transcript";

// ============================================================================
// Types
// ============================================================================

export interface TranscriptParagraphViewProps {
    /** Transcript segments to display */
    segments: TranscriptSegment[];
    /** Current playback time in seconds */
    currentTime?: number;
    /** Callback when a word is clicked (for seek functionality) */
    onWordClick?: (timestamp: number) => void;
    /** Callback when text is edited */
    onTextEdit?: (segmentId: string, newText: string) => void;
    /** Whether editing is enabled */
    editable?: boolean;
    /** Additional class names */
    className?: string;
    /** Whether to highlight the current word during playback */
    highlightCurrent?: boolean;
}

interface SelectionInfo {
    text: string;
    segmentId: string;
    segmentText: string;
    startOffset: number;
    endOffset: number;
    rect: DOMRect;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatTimestamp(seconds: number): string {
    if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function findCurrentWordInfo(
    segments: TranscriptSegment[],
    currentTime: number
): { segmentIndex: number; wordIndex: number } | null {
    for (let segIdx = 0; segIdx < segments.length; segIdx++) {
        const segment = segments[segIdx];
        if (currentTime >= segment.startTime && currentTime <= segment.endTime) {
            for (let wordIdx = 0; wordIdx < segment.words.length; wordIdx++) {
                const word = segment.words[wordIdx];
                if (currentTime >= word.start && currentTime <= word.end) {
                    return { segmentIndex: segIdx, wordIndex: wordIdx };
                }
            }
        }
    }
    return null;
}

// ============================================================================
// Word Component
// ============================================================================

interface WordSpanProps {
    word: TranscriptWord;
    isCurrentWord: boolean;
    onClick: () => void;
    highlightCurrent: boolean;
    segmentId: string;
}

function WordSpan({ word, isCurrentWord, onClick, highlightCurrent, segmentId }: WordSpanProps) {
    return (
        <span
            onClick={onClick}
            data-segment-id={segmentId}
            data-word={word.word}
            className={cn(
                "cursor-pointer transition-all duration-150 hover:bg-primary/20 rounded px-0.5",
                highlightCurrent && isCurrentWord && "bg-primary/30 text-primary font-semibold scale-105"
            )}
            title={`${formatTimestamp(word.start)} - ${formatTimestamp(word.end)}`}
        >
            {word.word}
        </span>
    );
}

// ============================================================================
// Edit Popover Component
// ============================================================================

interface EditPopoverProps {
    selection: SelectionInfo;
    onSave: (newText: string) => void;
    onCancel: () => void;
}

function EditPopover({ selection, onSave, onCancel }: EditPopoverProps) {
    const [editValue, setEditValue] = useState(selection.text);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
    }, []);

    const handleSave = () => {
        if (editValue.trim()) {
            onSave(editValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSave();
        } else if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
        }
    };

    // Position the popover near the selection
    const style: React.CSSProperties = {
        position: "fixed",
        top: selection.rect.bottom + 8,
        left: Math.max(8, Math.min(selection.rect.left, window.innerWidth - 320)),
        zIndex: 50,
    };

    return (
        <div
            style={style}
            className="bg-popover border rounded-lg shadow-lg p-3 w-[300px] animate-in fade-in-0 zoom-in-95"
        >
            <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">
                    Edit selected text:
                </label>
                <Input
                    ref={inputRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-sm"
                    placeholder="Enter new text..."
                />
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                        Press Enter to save, Esc to cancel
                    </span>
                    <div className="flex gap-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            className="h-7 px-2"
                        >
                            <IconX className="size-3.5" />
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSave}
                            className="h-7 px-2"
                        >
                            <IconCheck className="size-3.5" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// Selection Toolbar Component
// ============================================================================

interface SelectionToolbarProps {
    rect: DOMRect;
    onEdit: () => void;
}

function SelectionToolbar({ rect, onEdit }: SelectionToolbarProps) {
    const style: React.CSSProperties = {
        position: "fixed",
        top: rect.top - 40,
        left: rect.left + rect.width / 2 - 40,
        zIndex: 50,
    };

    return (
        <div
            style={style}
            className="bg-popover border rounded-lg shadow-lg p-1 animate-in fade-in-0 zoom-in-95"
        >
            <Button
                size="sm"
                variant="ghost"
                onClick={onEdit}
                className="h-7 px-2 gap-1"
            >
                <IconEdit className="size-3.5" />
                <span className="text-xs">Edit</span>
            </Button>
        </div>
    );
}

// ============================================================================
// TranscriptParagraphView Component
// ============================================================================

export function TranscriptParagraphView({
    segments,
    currentTime = 0,
    onWordClick,
    onTextEdit,
    editable = true,
    className,
    highlightCurrent = true,
}: TranscriptParagraphViewProps) {
    const [selection, setSelection] = useState<SelectionInfo | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const currentWordRef = useRef<HTMLSpanElement>(null);

    const currentWordInfo = useMemo(
        () => findCurrentWordInfo(segments, currentTime),
        [segments, currentTime]
    );

    // Handle text selection
    const handleMouseUp = useCallback(() => {
        if (!editable) return;

        const windowSelection = window.getSelection();
        if (!windowSelection || windowSelection.isCollapsed) {
            if (!isEditing) {
                setSelection(null);
            }
            return;
        }

        const selectedText = windowSelection.toString().trim();
        if (!selectedText) {
            setSelection(null);
            return;
        }

        // Find which segment the selection is in
        const range = windowSelection.getRangeAt(0);
        const startContainer = range.startContainer;

        // Walk up to find the segment
        let element: Node | null = startContainer;
        let segmentId: string | null = null;

        while (element && element !== containerRef.current) {
            if (element instanceof HTMLElement) {
                const id = element.dataset?.segmentId;
                if (id) {
                    segmentId = id;
                    break;
                }
            }
            element = element.parentNode;
        }

        // If we couldn't find segment from element, find it from text content
        if (!segmentId) {
            for (const segment of segments) {
                if (segment.text.includes(selectedText)) {
                    segmentId = segment.id;
                    break;
                }
            }
        }

        if (!segmentId) {
            setSelection(null);
            return;
        }

        const segment = segments.find(s => s.id === segmentId);
        if (!segment) {
            setSelection(null);
            return;
        }

        const rect = range.getBoundingClientRect();

        // Find the position of selected text in segment
        const segmentText = segment.text;
        const startOffset = segmentText.indexOf(selectedText);

        setSelection({
            text: selectedText,
            segmentId,
            segmentText,
            startOffset: startOffset >= 0 ? startOffset : 0,
            endOffset: startOffset >= 0 ? startOffset + selectedText.length : selectedText.length,
            rect,
        });
    }, [editable, isEditing, segments]);

    // Handle click outside to clear selection
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (isEditing) return;

            const target = e.target as HTMLElement;
            if (target.closest('[data-edit-popover]') || target.closest('[data-selection-toolbar]')) {
                return;
            }

            // Small delay to allow selection to complete
            setTimeout(() => {
                const windowSelection = window.getSelection();
                if (!windowSelection || windowSelection.isCollapsed) {
                    setSelection(null);
                }
            }, 10);
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isEditing]);

    // Start editing the selection
    const handleStartEdit = useCallback(() => {
        setIsEditing(true);
        window.getSelection()?.removeAllRanges();
    }, []);

    // Cancel editing
    const handleCancelEdit = useCallback(() => {
        setIsEditing(false);
        setSelection(null);
    }, []);

    // Save edited text
    const handleSaveEdit = useCallback((newText: string) => {
        if (!selection || !onTextEdit) {
            setIsEditing(false);
            setSelection(null);
            return;
        }

        // Replace the selected text in the segment
        const newSegmentText =
            selection.segmentText.slice(0, selection.startOffset) +
            newText +
            selection.segmentText.slice(selection.endOffset);

        onTextEdit(selection.segmentId, newSegmentText);
        setIsEditing(false);
        setSelection(null);
    }, [selection, onTextEdit]);

    // Handle word click for seeking
    const handleWordClick = useCallback(
        (word: TranscriptWord) => {
            onWordClick?.(word.start);
        },
        [onWordClick]
    );

    // Auto-scroll to current word
    useEffect(() => {
        if (highlightCurrent && currentWordRef.current) {
            currentWordRef.current.scrollIntoView({
                behavior: "smooth",
                block: "center",
            });
        }
    }, [currentWordInfo, highlightCurrent]);

    if (segments.length === 0) {
        return (
            <div
                className={cn(
                    "flex flex-col items-center justify-center gap-3 p-8 rounded-lg border border-dashed border-border bg-muted/30",
                    className
                )}
            >
                <IconClock className="size-10 text-muted-foreground" />
                <div className="text-center">
                    <p className="font-medium text-foreground">No transcript available</p>
                    <p className="text-sm text-muted-foreground">
                        The transcript will appear here once the video is processed.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-3", className)}>
            {/* Header */}
            <div className="flex items-center gap-2">
                <IconClock className="size-4 text-muted-foreground" />
                <span className="font-medium text-sm">Transcript</span>
            </div>

            {/* Content */}
            <ScrollArea className="h-[400px] rounded-lg border bg-card p-4">
                <div
                    ref={containerRef}
                    onMouseUp={handleMouseUp}
                    className="text-sm leading-relaxed text-foreground/90 select-text"
                >
                    {segments.map((segment, segIdx) => (
                        <span key={segment.id} data-segment-id={segment.id}>
                            {segment.words.map((word, wordIdx) => {
                                const isCurrentWord =
                                    currentWordInfo?.segmentIndex === segIdx &&
                                    currentWordInfo?.wordIndex === wordIdx;
                                return (
                                    <span
                                        key={`${segment.id}-${wordIdx}`}
                                        ref={isCurrentWord ? currentWordRef : undefined}
                                    >
                                        <WordSpan
                                            word={word}
                                            isCurrentWord={isCurrentWord}
                                            onClick={() => handleWordClick(word)}
                                            highlightCurrent={highlightCurrent}
                                            segmentId={segment.id}
                                        />
                                        {wordIdx < segment.words.length - 1 && " "}
                                    </span>
                                );
                            })}
                            {segIdx < segments.length - 1 && " "}
                        </span>
                    ))}
                </div>
            </ScrollArea>

            {/* Help text */}
            <p className="text-xs text-muted-foreground">
                Select text to edit, or click any word to seek to that position.
            </p>

            {/* Selection Toolbar - shows Edit button when text is selected */}
            {selection && !isEditing && (
                <div data-selection-toolbar>
                    <SelectionToolbar rect={selection.rect} onEdit={handleStartEdit} />
                </div>
            )}

            {/* Edit Popover - shows input when editing */}
            {selection && isEditing && (
                <div data-edit-popover>
                    <EditPopover
                        selection={selection}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                    />
                </div>
            )}
        </div>
    );
}

export default TranscriptParagraphView;
