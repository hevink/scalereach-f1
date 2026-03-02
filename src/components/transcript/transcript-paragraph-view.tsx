"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { IconClock, IconCheck, IconX } from "@tabler/icons-react";

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
    onSegmentEdit?: (segmentId: string, newText: string) => void;
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
// Segment Component
// ============================================================================

interface SegmentProps {
    segment: TranscriptSegment;
    segIdx: number;
    totalSegments: number;
    currentWordInfo: { segmentIndex: number; wordIndex: number } | null;
    highlightCurrent: boolean;
    onWordClick?: (word: TranscriptWord) => void;
    onSegmentEdit?: (segmentId: string, newText: string) => void;
    onFocusNext?: () => void;
    onFocusPrev?: () => void;
    currentWordRef: React.RefObject<HTMLSpanElement | null>;
    isActive: boolean;
    onActivate: () => void;
    onDeactivate: () => void;
}

function Segment({
    segment,
    segIdx,
    currentWordInfo,
    highlightCurrent,
    onWordClick,
    onSegmentEdit,
    onFocusNext,
    onFocusPrev,
    currentWordRef,
    isActive,
    onActivate,
    onDeactivate,
}: SegmentProps) {
    const [editText, setEditText] = useState(segment.text);
    const [isDirty, setIsDirty] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // sync external changes when not editing
    useEffect(() => {
        if (!isActive) {
            setEditText(segment.text);
            setIsDirty(false);
        }
    }, [segment.text, isActive]);

    // auto-resize textarea height
    useEffect(() => {
        if (isActive && textareaRef.current) {
            const el = textareaRef.current;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
            el.focus();
            // place cursor at end
            el.setSelectionRange(el.value.length, el.value.length);
        }
    }, [isActive]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setEditText(e.target.value);
        setIsDirty(e.target.value.trim() !== segment.text);
        // auto-resize
        e.target.style.height = "auto";
        e.target.style.height = `${e.target.scrollHeight}px`;
    }, [segment.text]);

    const confirmEdit = useCallback(() => {
        const trimmed = editText.trim();
        if (trimmed && isDirty) {
            onSegmentEdit?.(segment.id, trimmed);
        }
        onDeactivate();
    }, [editText, isDirty, segment.id, onSegmentEdit, onDeactivate]);

    const cancelEdit = useCallback(() => {
        setEditText(segment.text);
        setIsDirty(false);
        onDeactivate();
    }, [segment.text, onDeactivate]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            confirmEdit();
            onFocusNext?.();
        } else if (e.key === "Escape") {
            e.preventDefault();
            cancelEdit();
        } else if (e.key === "Tab") {
            e.preventDefault();
            confirmEdit();
            if (e.shiftKey) onFocusPrev?.();
            else onFocusNext?.();
        }
    }, [confirmEdit, cancelEdit, onFocusNext, onFocusPrev]);

    const timestamp = formatTimestamp(segment.startTime);
    const isCurrentSegment = currentWordInfo?.segmentIndex === segIdx;

    if (isActive && onSegmentEdit) {
        return (
            <div className="rounded-lg border border-blue-500/50 bg-zinc-800/80 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-700 bg-zinc-900/60">
                    <span className="text-[10px] text-zinc-400 font-mono">{timestamp}</span>
                    <div className="flex items-center gap-2">
                        {isDirty && <span className="text-[10px] text-amber-400">unsaved</span>}
                        <button
                            onMouseDown={(e) => { e.preventDefault(); confirmEdit(); }}
                            className="flex items-center gap-1 text-[10px] text-green-400 hover:text-green-300 px-1.5 py-0.5 rounded hover:bg-zinc-700"
                        >
                            <IconCheck className="size-3" /> Save
                        </button>
                        <button
                            onMouseDown={(e) => { e.preventDefault(); cancelEdit(); }}
                            className="flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 px-1.5 py-0.5 rounded hover:bg-zinc-700"
                        >
                            <IconX className="size-3" /> Cancel
                        </button>
                    </div>
                </div>
                <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    onBlur={confirmEdit}
                    className="w-full bg-transparent text-zinc-100 text-sm px-3 py-2 focus:outline-none resize-none leading-relaxed min-h-[40px]"
                    style={{ overflow: "hidden" }}
                />
                <div className="px-3 py-1 bg-zinc-900/40 flex gap-3">
                    <span className="text-[10px] text-zinc-600">↵ save</span>
                    <span className="text-[10px] text-zinc-600">Tab next</span>
                    <span className="text-[10px] text-zinc-600">Esc cancel</span>
                </div>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "group relative rounded-lg px-3 py-2 transition-colors",
                isCurrentSegment && highlightCurrent
                    ? "bg-zinc-800/80 border border-zinc-700"
                    : "hover:bg-zinc-800/50",
                onSegmentEdit && "cursor-text"
            )}
            onClick={onSegmentEdit ? onActivate : undefined}
        >
            {/* timestamp */}
            <span className="text-[10px] text-zinc-600 font-mono select-none mr-2">{timestamp}</span>

            {/* words */}
            {segment.words.map((word, wordIdx) => {
                const isCurrentWord =
                    currentWordInfo?.segmentIndex === segIdx &&
                    currentWordInfo?.wordIndex === wordIdx;
                return (
                    <span
                        key={`${segment.id}-${wordIdx}`}
                        ref={isCurrentWord ? currentWordRef : undefined}
                        onClick={(e) => {
                            if (onSegmentEdit) return; // let parent div handle
                            e.stopPropagation();
                            onWordClick?.(word);
                        }}
                        onMouseDown={(e) => {
                            if (!onSegmentEdit) return;
                            e.preventDefault(); // prevent blur on textarea
                            onWordClick?.(word);
                        }}
                        className={cn(
                            "text-sm leading-relaxed transition-colors duration-150",
                            highlightCurrent && isCurrentWord
                                ? "bg-white/20 text-white rounded px-0.5"
                                : "text-zinc-200 hover:text-white",
                            !onSegmentEdit && "cursor-pointer"
                        )}
                        title={`${formatTimestamp(word.start)} – ${formatTimestamp(word.end)}`}
                    >
                        {word.word}{wordIdx < segment.words.length - 1 ? " " : ""}
                    </span>
                );
            })}

            {/* edit hint */}
            {onSegmentEdit && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity select-none">
                    click to edit
                </span>
            )}
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
    onSegmentEdit,
    className,
    highlightCurrent = true,
}: TranscriptParagraphViewProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const currentWordRef = useRef<HTMLSpanElement>(null);
    const [activeSegmentIdx, setActiveSegmentIdx] = useState<number | null>(null);

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
        if (highlightCurrent && currentWordRef.current && activeSegmentIdx === null) {
            const element = currentWordRef.current;
            const container = containerRef.current;
            if (container) {
                const elementRect = element.getBoundingClientRect();
                const containerRect = container.getBoundingClientRect();
                if (
                    elementRect.top < containerRect.top ||
                    elementRect.bottom > containerRect.bottom
                ) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                }
            }
        }
    }, [currentWordInfo, highlightCurrent, activeSegmentIdx]);

    if (segments.length === 0) {
        return (
            <div className={cn("flex flex-col items-center justify-center gap-3 p-8 rounded-lg border border-dashed border-border bg-muted/30", className)}>
                <IconClock className="size-10 text-muted-foreground" />
                <div className="text-center">
                    <p className="font-medium text-foreground">No transcript available</p>
                    <p className="text-sm text-muted-foreground">The transcript will appear here once the video is processed.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col h-full overflow-hidden bg-black", className)}>
            <div className="shrink-0 flex items-center justify-between px-4 pt-4 pb-2 border-b border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-300">Transcript</h3>
                {onSegmentEdit && (
                    <span className="text-[10px] text-zinc-500">Click any line to edit</span>
                )}
            </div>
            <ScrollArea className="flex-1 h-0">
                <div ref={containerRef} className="px-3 py-3 space-y-1">
                    {segments.map((segment, segIdx) => (
                        <Segment
                            key={segment.id}
                            segment={segment}
                            segIdx={segIdx}
                            totalSegments={segments.length}
                            currentWordInfo={currentWordInfo}
                            highlightCurrent={highlightCurrent}
                            onWordClick={handleWordClick}
                            onSegmentEdit={onSegmentEdit}
                            onFocusNext={() => setActiveSegmentIdx(segIdx + 1 < segments.length ? segIdx + 1 : null)}
                            onFocusPrev={() => setActiveSegmentIdx(segIdx - 1 >= 0 ? segIdx - 1 : null)}
                            currentWordRef={currentWordRef}
                            isActive={activeSegmentIdx === segIdx}
                            onActivate={() => setActiveSegmentIdx(segIdx)}
                            onDeactivate={() => setActiveSegmentIdx(null)}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default TranscriptParagraphView;
