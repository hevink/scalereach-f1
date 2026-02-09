"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTimelineContext } from "./timeline-container";
import { MIN_TRACK_HEIGHT, MAX_TRACK_HEIGHT } from "./types";
import { clamp } from "./utils";

interface TrackResizerProps {
    trackId: string;
}

export function TrackResizer({ trackId }: TrackResizerProps) {
    const { state, resizeTrack } = useTimelineContext();
    const [isDragging, setIsDragging] = React.useState(false);
    const startYRef = React.useRef(0);
    const startHeightRef = React.useRef(0);

    const track = state.tracks.find((t) => t.id === trackId);
    if (!track) return null;

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        startYRef.current = e.clientY;
        startHeightRef.current = track.height;
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - startYRef.current;
            const newHeight = clamp(startHeightRef.current + deltaY, MIN_TRACK_HEIGHT, MAX_TRACK_HEIGHT);
            resizeTrack(trackId, newHeight);
        };

        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, trackId, resizeTrack]);

    return (
        <div
            className={cn(
                "h-1.5 cursor-row-resize flex items-center justify-center group hover:bg-zinc-700/50 transition-colors",
                isDragging && "bg-zinc-700/50",
            )}
            onMouseDown={handleMouseDown}
            data-no-seek
        >
            <div className={cn(
                "w-8 h-px bg-zinc-600 group-hover:bg-zinc-400 transition-colors",
                isDragging && "bg-zinc-400",
            )} />
        </div>
    );
}
