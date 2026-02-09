"use client";

import * as React from "react";
import { useTimelineContext } from "./timeline-container";
import { TRACK_LABEL_WIDTH } from "./types";
import { formatTime, clamp } from "./utils";

interface MarkerProps {
    marker: { id: string; time: number; label?: string; color: string };
    totalHeight: number;
}

export const Marker = React.memo(function Marker({ marker, totalHeight }: MarkerProps) {
    const { timeToX, xToTime, removeMarker, updateMarker, clipDuration, scrollContainerRef } = useTimelineContext();
    const [isDragging, setIsDragging] = React.useState(false);
    const [showTooltip, setShowTooltip] = React.useState(false);

    const x = timeToX(marker.time);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        removeMarker(marker.id);
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = scrollContainerRef.current;
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const mx = e.clientX - rect.left + scrollLeft - TRACK_LABEL_WIDTH;
            const time = clamp(xToTime(mx), 0, clipDuration);
            updateMarker(marker.id, { time });
        };

        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, xToTime, scrollContainerRef, updateMarker, marker.id, clipDuration]);

    return (
        <div
            className="absolute z-20 pointer-events-none"
            style={{
                left: TRACK_LABEL_WIDTH + x,
                top: 0,
                transform: "translateX(-50%)",
                height: totalHeight,
            }}
        >
            {/* Flag at top */}
            <div
                className="pointer-events-auto cursor-pointer relative transition-transform duration-150 hover:scale-110"
                onMouseDown={handleMouseDown}
                onContextMenu={handleContextMenu}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => !isDragging && setShowTooltip(false)}
                data-no-seek
            >
                <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                    <path d="M0 0H10L7 6L10 12H0V0Z" fill={marker.color} />
                </svg>
            </div>

            {/* Tooltip */}
            {showTooltip && (
                <div className="absolute top-3 left-3 bg-zinc-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-50 border border-zinc-700">
                    {marker.label || formatTime(marker.time)}
                    <div className="text-zinc-500 text-[9px]">Right-click to delete</div>
                </div>
            )}

            {/* Dashed vertical line */}
            <div
                className="w-px mx-auto pointer-events-none"
                style={{
                    height: totalHeight - 12,
                    backgroundImage: `repeating-linear-gradient(to bottom, ${marker.color} 0px, ${marker.color} 3px, transparent 3px, transparent 6px)`,
                }}
            />
        </div>
    );
});
