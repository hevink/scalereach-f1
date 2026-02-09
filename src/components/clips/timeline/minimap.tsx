"use client";

import * as React from "react";
import { useTimelineContext } from "./timeline-container";
import { TRACK_LABEL_WIDTH, MINIMAP_HEIGHT } from "./types";

export function Minimap() {
    const { state, clipDuration, currentTime, timeToX, onSeek, setScrollLeft, scrollContainerRef } = useTimelineContext();
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);

    const minimapWidth = state.containerWidth - TRACK_LABEL_WIDTH - 16;

    // Draw minimap
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || minimapWidth <= 0 || clipDuration <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = minimapWidth * dpr;
        canvas.height = MINIMAP_HEIGHT * dpr;
        ctx.scale(dpr, dpr);

        // Background
        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, minimapWidth, MINIMAP_HEIGHT);

        // Marker dots
        for (const marker of state.markers) {
            const mx = (marker.time / clipDuration) * minimapWidth;
            ctx.fillStyle = marker.color;
            ctx.beginPath();
            ctx.arc(mx, MINIMAP_HEIGHT / 2, 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // Loop region
        if (state.loopRegion?.enabled) {
            const lx1 = (state.loopRegion.inPoint / clipDuration) * minimapWidth;
            const lx2 = (state.loopRegion.outPoint / clipDuration) * minimapWidth;
            ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
            ctx.fillRect(lx1, 0, lx2 - lx1, MINIMAP_HEIGHT);
        }

        // Playhead position
        const px = (currentTime / clipDuration) * minimapWidth;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(px - 0.5, 0, 1, MINIMAP_HEIGHT);

        // Viewport rectangle
        const container = scrollContainerRef.current;
        if (container && state.trackWidth > 0) {
            const viewportStart = (container.scrollLeft / (state.trackWidth + TRACK_LABEL_WIDTH + 16)) * minimapWidth;
            const viewportWidth = (state.containerWidth / (state.trackWidth + TRACK_LABEL_WIDTH + 16)) * minimapWidth;

            ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
            ctx.lineWidth = 1;
            ctx.strokeRect(viewportStart, 0.5, Math.min(viewportWidth, minimapWidth - viewportStart), MINIMAP_HEIGHT - 1);
        }
    }, [minimapWidth, clipDuration, currentTime, state.markers, state.loopRegion, state.trackWidth, state.containerWidth, state.scrollLeft, scrollContainerRef]);

    // Click/drag to navigate
    const handleSeekFromMinimap = React.useCallback(
        (clientX: number) => {
            const container = containerRef.current;
            if (!container || clipDuration <= 0) return;

            const rect = container.getBoundingClientRect();
            const x = clientX - rect.left;
            const ratio = Math.max(0, Math.min(1, x / minimapWidth));

            // Seek to position
            onSeek(ratio * clipDuration);

            // Also scroll the main timeline
            const scrollTarget = ratio * (state.trackWidth + TRACK_LABEL_WIDTH + 16) - state.containerWidth / 2;
            scrollContainerRef.current?.scrollTo({ left: Math.max(0, scrollTarget), behavior: "smooth" });
        },
        [clipDuration, minimapWidth, onSeek, state.trackWidth, state.containerWidth, scrollContainerRef],
    );

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        handleSeekFromMinimap(e.clientX);
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => handleSeekFromMinimap(e.clientX);
        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, handleSeekFromMinimap]);

    if (minimapWidth <= 0) return null;

    return (
        <div className="flex border-b border-zinc-800">
            <div style={{ width: TRACK_LABEL_WIDTH, flexShrink: 0 }} className="bg-zinc-900/50 flex items-center justify-center">
                <span className="text-[9px] text-zinc-600">Overview</span>
            </div>
            <div
                ref={containerRef}
                className="cursor-pointer"
                style={{ width: minimapWidth, height: MINIMAP_HEIGHT }}
                onMouseDown={handleMouseDown}
                data-no-seek
            >
                <canvas
                    ref={canvasRef}
                    style={{ width: minimapWidth, height: MINIMAP_HEIGHT, display: "block" }}
                />
            </div>
        </div>
    );
}
