"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTimelineContext } from "./timeline-container";
import { IconLetterT } from "@tabler/icons-react";

export interface TextOverlayItem {
    id: string;
    text: string;
    startTime: number;
    endTime: number;
    color: string;
}

interface TextOverlayTrackProps {
    overlays: TextOverlayItem[];
    height?: number;
    onOverlayClick?: (id: string) => void;
    onOverlayTimeChange?: (id: string, startTime: number, endTime: number) => void;
}

export function TextOverlayTrack({ overlays, height = 32, onOverlayClick, onOverlayTimeChange }: TextOverlayTrackProps) {
    const { state, timeToX, xToTime, clipDuration } = useTimelineContext();

    if (overlays.length === 0) return null;

    return (
        <div
            className="relative rounded overflow-hidden border border-zinc-700/50"
            style={{ width: state.trackWidth, height }}
            data-no-seek
        >
            {/* Background */}
            <div className="absolute inset-0 bg-zinc-900/60" />

            {overlays.map((overlay) => (
                <DraggableOverlay
                    key={overlay.id}
                    overlay={overlay}
                    height={height}
                    timeToX={timeToX}
                    xToTime={xToTime}
                    clipDuration={clipDuration}
                    trackWidth={state.trackWidth}
                    onClick={onOverlayClick}
                    onTimeChange={onOverlayTimeChange}
                />
            ))}
        </div>
    );
}

interface DraggableOverlayProps {
    overlay: TextOverlayItem;
    height: number;
    timeToX: (t: number) => number;
    xToTime: (x: number) => number;
    clipDuration: number;
    trackWidth: number;
    onClick?: (id: string) => void;
    onTimeChange?: (id: string, startTime: number, endTime: number) => void;
}

function DraggableOverlay({ overlay, height, timeToX, xToTime, clipDuration, trackWidth, onClick, onTimeChange }: DraggableOverlayProps) {
    const left = timeToX(overlay.startTime);
    const right = timeToX(overlay.endTime);
    const width = right - left;

    const dragRef = React.useRef<{ type: "move" | "left" | "right"; startX: number; startStart: number; startEnd: number } | null>(null);

    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const round2 = (v: number) => Math.round(v * 100) / 100;

    const handleMouseDown = (e: React.MouseEvent, type: "move" | "left" | "right") => {
        e.preventDefault();
        e.stopPropagation();
        dragRef.current = {
            type,
            startX: e.clientX,
            startStart: overlay.startTime,
            startEnd: overlay.endTime,
        };

        const handleMouseMove = (ev: MouseEvent) => {
            if (!dragRef.current) return;
            const dx = ev.clientX - dragRef.current.startX;
            const dt = (dx / trackWidth) * clipDuration;
            const duration = dragRef.current.startEnd - dragRef.current.startStart;

            let newStart = dragRef.current.startStart;
            let newEnd = dragRef.current.startEnd;

            if (dragRef.current.type === "move") {
                newStart = round2(clamp(dragRef.current.startStart + dt, 0, clipDuration - duration));
                newEnd = round2(newStart + duration);
            } else if (dragRef.current.type === "left") {
                newStart = round2(clamp(dragRef.current.startStart + dt, 0, dragRef.current.startEnd - 0.1));
                newEnd = dragRef.current.startEnd;
            } else {
                newStart = dragRef.current.startStart;
                newEnd = round2(clamp(dragRef.current.startEnd + dt, dragRef.current.startStart + 0.1, clipDuration));
            }

            onTimeChange?.(overlay.id, newStart, newEnd);
        };

        const handleMouseUp = () => {
            dragRef.current = null;
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    if (width < 2) return null;

    return (
        <div
            className={cn(
                "absolute top-1 bottom-1 rounded-sm flex items-center overflow-hidden",
                "border border-amber-500/40 bg-amber-500/20 hover:bg-amber-500/30",
                "transition-colors group select-none"
            )}
            style={{ left, width: Math.max(width, 20) }}
            onMouseDown={(e) => handleMouseDown(e, "move")}
            onClick={(e) => { e.stopPropagation(); onClick?.(overlay.id); }}
        >
            {/* Left resize handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-400/30 z-10"
                onMouseDown={(e) => handleMouseDown(e, "left")}
            />

            {/* Content */}
            <div className="flex items-center gap-1 px-2 pointer-events-none">
                <IconLetterT className="size-3 text-amber-400 shrink-0" />
                {width > 50 && (
                    <span className="text-[9px] text-amber-300 truncate leading-none">
                        {overlay.text}
                    </span>
                )}
            </div>

            {/* Right resize handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-amber-400/30 z-10"
                onMouseDown={(e) => handleMouseDown(e, "right")}
            />
        </div>
    );
}
