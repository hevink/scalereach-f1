"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
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
    currentWordInfo: { segmentIndex: number; wordIndex: number } | null;
    highlightCurrent: boolean;
    onWordClick?: (word: TranscriptWord) => void;
    currentWordRef: React.RefObject<HTMLSpanElement | null>;
}

function Segment({
    segment,
    segIdx,
    currentWordInfo,
    highlightCurrent,
    onWordClick,
    currentWordRef,
}: SegmentProps) {
    return (
        <p className="text-[#FAFAFA] leading-relaxed text-sm rounded px-1 py-0.5">
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
            {/* Header */}
            <div className="shrink-0 flex items-center px-6 pt-4 pb-2">
                <h3 className="text-sm font-semibold text-zinc-300">Transcript</h3>
            </div>
            <ScrollArea className="flex-1 h-0">
                <div ref={containerRef} className="mx-6 pb-8 space-y-4">
                    {segments.map((segment, segIdx) => (
                        <Segment
                            key={segment.id}
                            segment={segment}
                            segIdx={segIdx}
                            currentWordInfo={currentWordInfo}
                            highlightCurrent={highlightCurrent}
                            onWordClick={handleWordClick}
                            currentWordRef={currentWordRef}
                        />
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
}

export default TranscriptParagraphView;
