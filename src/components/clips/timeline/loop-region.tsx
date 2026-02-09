"use client";

import * as React from "react";
import { useTimelineContext } from "./timeline-container";
import { TRACK_LABEL_WIDTH } from "./types";

interface LoopRegionOverlayProps {
    totalHeight: number;
}

export function LoopRegionOverlay({ totalHeight }: LoopRegionOverlayProps) {
    const { state, timeToX, xToTime, setLoopRegion, clipDuration, scrollContainerRef } = useTimelineContext();
    const [dragEdge, setDragEdge] = React.useState<"in" | "out" | null>(null);

    if (!state.loopRegion?.enabled) return null;

    const inX = timeToX(state.loopRegion.inPoint);
    const outX = timeToX(state.loopRegion.outPoint);
    const width = outX - inX;

    const handleEdgeMouseDown = (e: React.MouseEvent, edge: "in" | "out") => {
        e.preventDefault();
        e.stopPropagation();
        setDragEdge(edge);
    };

    React.useEffect(() => {
        if (!dragEdge) return;

        const handleMouseMove = (e: MouseEvent) => {
            const container = scrollContainerRef.current;
            if (!container) return;

            const rect = container.getBoundingClientRect();
            const scrollLeft = container.scrollLeft;
            const x = e.clientX - rect.left + scrollLeft - TRACK_LABEL_WIDTH;
            const time = xToTime(x);

            if (!state.loopRegion) return;

            if (dragEdge === "in") {
                setLoopRegion({
                    ...state.loopRegion,
                    inPoint: Math.max(0, Math.min(time, state.loopRegion.outPoint - 0.1)),
                });
            } else {
                setLoopRegion({
                    ...state.loopRegion,
                    outPoint: Math.min(clipDuration, Math.max(time, state.loopRegion.inPoint + 0.1)),
                });
            }
        };

        const handleMouseUp = () => setDragEdge(null);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragEdge, state.loopRegion, xToTime, setLoopRegion, clipDuration, scrollContainerRef]);

    return (
        <div
            className="absolute z-10 pointer-events-none"
            style={{
                left: TRACK_LABEL_WIDTH + inX,
                top: 0,
                width,
                height: totalHeight,
            }}
        >
            {/* Semi-transparent overlay */}
            <div className="absolute inset-0 bg-blue-500/10 border-x border-blue-500/40" />

            {/* In-point handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500/60 cursor-col-resize pointer-events-auto hover:bg-blue-500"
                onMouseDown={(e) => handleEdgeMouseDown(e, "in")}
                data-no-seek
            />

            {/* Out-point handle */}
            <div
                className="absolute right-0 top-0 bottom-0 w-1.5 bg-blue-500/60 cursor-col-resize pointer-events-auto hover:bg-blue-500"
                onMouseDown={(e) => handleEdgeMouseDown(e, "out")}
                data-no-seek
            />
        </div>
    );
}
