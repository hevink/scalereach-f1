"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTimelineContext } from "./timeline-container";
import { TRACK_LABEL_WIDTH } from "./types";
import { formatTime } from "./utils";

interface PlayheadProps {
    totalHeight: number;
}

export function Playhead({ totalHeight }: PlayheadProps) {
    const { state, currentTime, clipDuration, timeToX, xToTime, onSeek, scrollContainerRef } = useTimelineContext();
    const [isDragging, setIsDragging] = React.useState(false);
    const [showTooltip, setShowTooltip] = React.useState(false);

    const position = timeToX(currentTime);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const x = e.clientX - rect.left + scrollLeft - TRACK_LABEL_WIDTH;
            const time = xToTime(x);
            onSeek(time);
        };

        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, xToTime, onSeek, scrollContainerRef]);

    return (
        <div
            className="absolute z-30 pointer-events-none"
            style={{
                left: TRACK_LABEL_WIDTH + position,
                top: 0,
                transform: "translateX(-50%)",
                height: totalHeight,
                transition: isDragging ? "none" : "left 50ms linear",
            }}
        >
            {/* Grab handle */}
            <div
                className={cn(
                    "relative w-[11px] h-[18px] bg-white rounded-sm pointer-events-auto",
                    isDragging ? "cursor-grabbing" : "cursor-grab",
                )}
                style={{ left: "50%", transform: "translateX(-50%)", marginTop: -2 }}
                onMouseDown={handleMouseDown}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => !isDragging && setShowTooltip(false)}
                data-no-seek
            >
                {/* Notch lines */}
                <div className="absolute inset-x-[3px] top-[4px] bottom-[4px] flex flex-col justify-center gap-[2px]">
                    <div className="h-px bg-zinc-800" />
                    <div className="h-px bg-zinc-800" />
                </div>
            </div>

            {/* Time tooltip */}
            {(showTooltip || isDragging) && (
                <div
                    className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-[10px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none"
                >
                    {formatTime(currentTime)}
                </div>
            )}

            {/* Vertical line */}
            <div
                className="w-px bg-white mx-auto"
                style={{ height: totalHeight - 16 }}
            />
        </div>
    );
}
