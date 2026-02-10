"use client";

import * as React from "react";
import { useTimelineContext } from "./timeline-container";
import { getTimeInterval, formatTime } from "./utils";
import { TIME_RULER_HEIGHT } from "./types";

export function TimeRuler() {
    const { state, clipDuration, timeToX, xToTime, onSeek } = useTimelineContext();
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || state.trackWidth <= 0 || clipDuration <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = state.trackWidth * dpr;
        canvas.height = TIME_RULER_HEIGHT * dpr;
        ctx.scale(dpr, dpr);

        ctx.clearRect(0, 0, state.trackWidth, TIME_RULER_HEIGHT);

        // Background
        ctx.fillStyle = "#18181b";
        ctx.fillRect(0, 0, state.trackWidth, TIME_RULER_HEIGHT);

        const pixelsPerSecond = state.trackWidth / clipDuration;
        const { major, minor } = getTimeInterval(pixelsPerSecond);

        ctx.font = "10px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";

        // Minor ticks
        for (let t = 0; t <= clipDuration; t += minor) {
            const x = timeToX(t);
            ctx.fillStyle = "#3f3f46";
            ctx.fillRect(x, TIME_RULER_HEIGHT - 4, 1, 4);
        }

        // Major ticks with labels
        for (let t = 0; t <= clipDuration; t += major) {
            const x = timeToX(t);
            ctx.fillStyle = "#52525b";
            ctx.fillRect(x, TIME_RULER_HEIGHT - 8, 1, 8);

            ctx.fillStyle = "#a1a1aa";
            const label = t < 60 ? `${t.toFixed(t % 1 === 0 ? 0 : 1)}s` : formatTime(t);
            ctx.fillText(label, x, TIME_RULER_HEIGHT - 12);
        }

        // Marker indicators
        for (const marker of state.markers) {
            const mx = timeToX(marker.time);
            ctx.fillStyle = marker.color;
            ctx.beginPath();
            ctx.moveTo(mx - 4, 0);
            ctx.lineTo(mx + 4, 0);
            ctx.lineTo(mx, 6);
            ctx.closePath();
            ctx.fill();
        }

        // Loop region highlight
        if (state.loopRegion?.enabled) {
            const lx1 = timeToX(state.loopRegion.inPoint);
            const lx2 = timeToX(state.loopRegion.outPoint);
            ctx.fillStyle = "rgba(59, 130, 246, 0.15)";
            ctx.fillRect(lx1, 0, lx2 - lx1, TIME_RULER_HEIGHT);
        }
    }, [state.trackWidth, clipDuration, state.markers, state.loopRegion, state.zoomLevel, timeToX]);

    const handleClick = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const ratio = state.trackWidth > 0 ? x * (state.trackWidth / rect.width) : x;
        const time = xToTime(ratio);
        onSeek(time);
    };

    return (
        <canvas
            ref={canvasRef}
            style={{ width: state.trackWidth, height: TIME_RULER_HEIGHT, display: "block", cursor: "pointer" }}
            onClick={handleClick}
            data-no-seek
        />
    );
}
