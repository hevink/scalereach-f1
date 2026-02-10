"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { TextOverlay } from "@/components/text/text-overlay-panel";
import { formatTime } from "./utils";

// ============================================================================
// Constants
// ============================================================================

export const TEXT_TRACK_HEIGHT = 36;

// ============================================================================
// Text Track Props
// ============================================================================

interface TextTrackProps {
    textOverlays: TextOverlay[];
    clipDuration: number;
    trackWidth: number;
    currentTime: number;
    selectedId: string | null;
    onSelect?: (id: string | null) => void;
    onUpdate?: (id: string, updates: Partial<TextOverlay>) => void;
}

// ============================================================================
// Text Track Component
// ============================================================================

export function TextTrack({
    textOverlays,
    clipDuration,
    trackWidth,
    currentTime,
    selectedId,
    onSelect,
    onUpdate,
}: TextTrackProps) {
    if (clipDuration <= 0 || trackWidth <= 0) return null;

    const timeToX = (time: number) => (time / clipDuration) * trackWidth;

    return (
        <div
            className="relative bg-zinc-900/50 rounded overflow-hidden"
            style={{ width: trackWidth, height: TEXT_TRACK_HEIGHT }}
        >
            {/* Background grid lines */}
            <div className="absolute inset-0 opacity-10">
                {Array.from({ length: Math.ceil(clipDuration) }, (_, i) => (
                    <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px bg-zinc-500"
                        style={{ left: timeToX(i) }}
                    />
                ))}
            </div>

            {/* Text overlay blocks */}
            {textOverlays.map((overlay) => (
                <TextBlock
                    key={overlay.id}
                    overlay={overlay}
                    clipDuration={clipDuration}
                    trackWidth={trackWidth}
                    isSelected={overlay.id === selectedId}
                    isActive={currentTime >= overlay.startTime && currentTime <= overlay.endTime}
                    onSelect={() => onSelect?.(overlay.id === selectedId ? null : overlay.id)}
                    onUpdate={onUpdate}
                />
            ))}

            {/* Empty state */}
            {textOverlays.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] text-zinc-600">No text overlays</span>
                </div>
            )}
        </div>
    );
}

// ============================================================================
// Text Block Component (individual overlay on the track)
// ============================================================================

interface TextBlockProps {
    overlay: TextOverlay;
    clipDuration: number;
    trackWidth: number;
    isSelected: boolean;
    isActive: boolean;
    onSelect: () => void;
    onUpdate?: (id: string, updates: Partial<TextOverlay>) => void;
}

const TextBlock = React.memo(function TextBlock({
    overlay,
    clipDuration,
    trackWidth,
    isSelected,
    isActive,
    onSelect,
    onUpdate,
}: TextBlockProps) {
    const [dragState, setDragState] = React.useState<{
        type: "move" | "left" | "right";
        startX: number;
        startStart: number;
        startEnd: number;
    } | null>(null);

    const timeToX = (time: number) => (time / clipDuration) * trackWidth;
    const xToTime = (x: number) => Math.max(0, Math.min(clipDuration, (x / trackWidth) * clipDuration));

    const left = timeToX(overlay.startTime);
    const width = timeToX(overlay.endTime) - left;

    // Drag handlers
    const handleMouseDown = React.useCallback(
        (type: "move" | "left" | "right", e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            onSelect();
            setDragState({
                type,
                startX: e.clientX,
                startStart: overlay.startTime,
                startEnd: overlay.endTime,
            });
        },
        [overlay.startTime, overlay.endTime, onSelect],
    );

    React.useEffect(() => {
        if (!dragState || !onUpdate) return;

        const handleMouseMove = (e: MouseEvent) => {
            const dx = e.clientX - dragState.startX;
            const dt = (dx / trackWidth) * clipDuration;

            if (dragState.type === "move") {
                const duration = dragState.startEnd - dragState.startStart;
                let newStart = dragState.startStart + dt;
                let newEnd = newStart + duration;

                // Clamp to bounds
                if (newStart < 0) {
                    newStart = 0;
                    newEnd = duration;
                }
                if (newEnd > clipDuration) {
                    newEnd = clipDuration;
                    newStart = clipDuration - duration;
                }

                onUpdate(overlay.id, { startTime: newStart, endTime: newEnd });
            } else if (dragState.type === "left") {
                const newStart = Math.max(0, Math.min(dragState.startEnd - 0.1, dragState.startStart + dt));
                onUpdate(overlay.id, { startTime: newStart });
            } else if (dragState.type === "right") {
                const newEnd = Math.min(clipDuration, Math.max(dragState.startStart + 0.1, dragState.startEnd + dt));
                onUpdate(overlay.id, { endTime: newEnd });
            }
        };

        const handleMouseUp = () => setDragState(null);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragState, onUpdate, overlay.id, trackWidth, clipDuration]);

    return (
        <div
            className={cn(
                "absolute top-1 bottom-1 rounded-sm flex items-center overflow-hidden cursor-pointer transition-colors",
                isSelected
                    ? "bg-blue-600/80 ring-1 ring-blue-400"
                    : isActive
                        ? "bg-blue-600/50"
                        : "bg-zinc-700/80 hover:bg-zinc-600/80",
            )}
            style={{ left, width: Math.max(width, 4) }}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            data-no-seek
        >
            {/* Left resize handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/20 z-10"
                onMouseDown={(e) => handleMouseDown("left", e)}
            />

            {/* Move area */}
            <div
                className={cn(
                    "flex-1 px-2 truncate text-[10px] font-medium leading-none select-none",
                    dragState?.type === "move" ? "cursor-grabbing" : "cursor-grab",
                )}
                onMouseDown={(e) => handleMouseDown("move", e)}
            >
                <div className="flex items-center gap-1">
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="shrink-0 opacity-60">
                        <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                    </svg>
                    <span className="truncate text-white/90">{overlay.text || "Text"}</span>
                </div>
            </div>

            {/* Right resize handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-white/20 z-10"
                onMouseDown={(e) => handleMouseDown("right", e)}
            />

            {/* Duration tooltip on hover */}
            {isSelected && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[9px] font-mono px-1 py-0.5 rounded whitespace-nowrap pointer-events-none z-50 border border-zinc-700">
                    {formatTime(overlay.startTime)} - {formatTime(overlay.endTime)}
                </div>
            )}
        </div>
    );
});
