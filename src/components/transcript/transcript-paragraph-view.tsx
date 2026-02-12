"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconClock } from "@tabler/icons-react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { TranscriptSegment, TranscriptWord } from "@/lib/api/transcript";

// ============================================================================
// Types
// ============================================================================

export interface TranscriptParagraphViewProps {
    segments: TranscriptSegment[];
    currentTime?: number;
    onWordClick?: (timestamp: number) => void;
    onTextEdit?: (segmentId: string, newText: string) => void;
    editable?: boolean;
    className?: string;
    highlightCurrent?: boolean;
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
        for (let wordIdx = 0; wordIdx < segment.words.length; wordIdx++) {
            const word = segment.words[wordIdx];
            if (currentTime >= word.start && currentTime <= word.end) {
                return { segmentIndex: segIdx, wordIndex: wordIdx };
            }
        }
    }
    return null;
}

// ============================================================================
// Inline Editable Segment Component
// ============================================================================

interface InlineEditableSegmentProps {
    segment: TranscriptSegment;
    segIdx: number;
    currentWordInfo: { segmentIndex: number; wordIndex: number } | null;
    highlightCurrent: boolean;
    editable: boolean;
    onWordClick?: (word: TranscriptWord) => void;
    onTextEdit?: (segmentId: string, newText: string) => void;
    currentWordRef: React.RefObject<HTMLSpanElement | null>;
}

function InlineEditableSegment({
    segment,
    segIdx,
    currentWordInfo,
    highlightCurrent,
    editable,
    onWordClick,
    onTextEdit,
    currentWordRef,
}: InlineEditableSegmentProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [displayText, setDisplayText] = useState(segment.text);
    const editRef = useRef<HTMLParagraphElement>(null);
    const originalText = useRef<string>("");

    // Sync displayText when segment.text changes from parent
    useEffect(() => {
        setDisplayText(segment.text);
    }, [segment.text]);

    const startEditing = useCallback(() => {
        if (!editable || isEditing) return;
        originalText.current = displayText;
        setIsEditing(true);
    }, [editable, isEditing, displayText]);

    // Focus when entering edit mode
    useEffect(() => {
        if (isEditing && editRef.current) {
            editRef.current.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(editRef.current);
            range.collapse(false);
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, [isEditing]);

    const saveEdit = useCallback(() => {
        if (!editRef.current) {
            setIsEditing(false);
            return;
        }
        const newText = editRef.current.textContent?.trim() || "";
        setIsEditing(false);
        if (newText && newText !== originalText.current) {
            setDisplayText(newText);
            onTextEdit?.(segment.id, newText);
        }
    }, [onTextEdit, segment.id]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            saveEdit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            if (editRef.current) {
                editRef.current.textContent = originalText.current;
            }
            setIsEditing(false);
        }
    }, [saveEdit]);

    // Check if text was edited (displayText no longer matches the joined words)
    const joinedWords = segment.words.map(w => w.word).join(" ");
    const wasEdited = displayText !== joinedWords;

    if (isEditing) {
        return (
            <div className="relative group">
                <p
                    ref={editRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={saveEdit}
                    onKeyDown={handleKeyDown}
                    className="text-[#FAFAFA] leading-relaxed text-sm outline-none ring-1 ring-primary/50 rounded px-1 py-0.5 bg-white/5"
                >
                    {displayText}
                </p>
                <span className="absolute -bottom-5 left-0 text-[10px] text-muted-foreground">
                    Enter to save · Esc to cancel
                </span>
            </div>
        );
    }

    // If text was edited, render plain text (words array is stale)
    if (wasEdited) {
        return (
            <p
                onDoubleClick={startEditing}
                className={cn(
                    "text-[#FAFAFA] leading-relaxed text-sm rounded px-1 py-0.5 transition-colors",
                    editable && "hover:bg-white/5 cursor-text"
                )}
            >
                {displayText}
            </p>
        );
    }

    return (
        <p
            onDoubleClick={startEditing}
            className={cn(
                "text-[#FAFAFA] leading-relaxed text-sm rounded px-1 py-0.5 transition-colors",
                editable && "hover:bg-white/5 cursor-text"
            )}
        >
            {segment.words.map((word, wordIdx) => {
                const isCurrentWord =
                    currentWordInfo?.segmentIndex === segIdx &&
                    currentWordInfo?.wordIndex === wordIdx;
                return (
                    <span
                        key={`${segment.id}-${wordIdx}`}
                        ref={isCurrentWord ? currentWordRef : undefined}
                        onClick={(e) => {
                            e.stopPropagation();
                            onWordClick?.(word);
                        }}
                        className={cn(
                            "cursor-pointer transition-colors duration-200",
                            highlightCurrent && isCurrentWord
                                ? "bg-secondary rounded px-0.5 py-1"
                                : "hover:text-gray-300"
                        )}
                        title={`${formatTimestamp(word.start)} - ${formatTimestamp(word.end)}`}
                    >
                        {word.word}{wordIdx < segment.words.length - 1 ? " " : ""}
                    </span>
                );
            })}
        </p>
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
    const containerRef = useRef<HTMLDivElement>(null);
    const currentWordRef = useRef<HTMLSpanElement>(null);

    const currentWordInfo = useMemo(
        () => findCurrentWordInfo(segments, currentTime),
        [segments, currentTime]
    );

    const handleWordClick = useCallback(
        (word: TranscriptWord) => {
            onWordClick?.(word.start);
        },
        [onWordClick]
    );

    // Auto-scroll to current word
    useEffect(() => {
        if (highlightCurrent && currentWordRef.current) {
            const element = currentWordRef.current;
            const container = containerRef.current;
            if (container) {
                const elementRect = element.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                if (
                    elementRect.top < containerRect.top ||
                    elementRect.bottom > containerRect.bottom
                ) {
                    element.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                        inline: "nearest",
                    });
                }
            }
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
        <div className={cn("flex flex-col h-full overflow-hidden bg-black", className)}>
            <ScrollArea className="flex-1 h-0">
                <div ref={containerRef} className="mt-4 mx-6 pb-8 space-y-4">
                    {segments.map((segment, segIdx) => (
                        <InlineEditableSegment
                            key={segment.id}
                            segment={segment}
                            segIdx={segIdx}
                            currentWordInfo={currentWordInfo}
                            highlightCurrent={highlightCurrent}
                            editable={editable}
                            onWordClick={handleWordClick}
                            onTextEdit={onTextEdit}
                            currentWordRef={currentWordRef}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default TranscriptParagraphView;
