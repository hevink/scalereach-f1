"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTimelineContext } from "./timeline-container";
import { MIN_ZOOM, MAX_ZOOM } from "./types";

interface ToolbarProps {
    onHide: () => void;
}

export function Toolbar({ onHide }: ToolbarProps) {
    const {
        state,
        setZoom,
        setSnapEnabled,
        addMarker,
        currentTime,
        setLoopRegion,
        clipDuration,
    } = useTimelineContext();

    const handleAddMarker = () => {
        addMarker(currentTime);
    };

    const handleZoomToFit = () => {
        setZoom(1);
    };

    return (
        <div className="flex items-center justify-between h-10 px-3 border-b border-zinc-800 bg-zinc-900/80">
            {/* Left: tools */}
            <div className="flex items-center gap-1">
                {/* Hide timeline */}
                <button
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                    onClick={onHide}
                    title="Hide timeline"
                >
                    <svg width="14" height="14" strokeWidth="1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 5H18C20.21 5 22 6.79 22 9V15C22 17.21 20.21 19 18 19H6C3.79 19 2 17.21 2 15V9C2 6.79 3.79 5 6 5Z" />
                        <path d="M14.5 10.75L12 13.25L9.5 10.75" />
                    </svg>
                    <span className="hidden sm:inline">Hide</span>
                </button>

                <div className="w-px h-5 bg-zinc-700 mx-1" />

                {/* Snap toggle */}
                <button
                    className={cn(
                        "flex items-center gap-1.5 text-xs px-2 py-1 rounded transition-colors",
                        state.snapEnabled ? "text-blue-400 bg-blue-500/10" : "text-zinc-400 hover:text-white hover:bg-zinc-800",
                    )}
                    onClick={() => setSnapEnabled(!state.snapEnabled)}
                    title="Toggle snap"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10H3M21 6H3M21 14H3M21 18H3" />
                    </svg>
                    <span className="hidden sm:inline">Snap</span>
                </button>

                {/* Add marker */}
                <button
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white px-2 py-1 rounded hover:bg-zinc-800 transition-colors"
                    onClick={handleAddMarker}
                    title="Add marker at playhead (M)"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                        <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    <span className="hidden sm:inline">Marker</span>
                </button>
            </div>

            {/* Right: zoom controls */}
            <div className="flex items-center gap-1">
                <button
                    className="w-7 h-7 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    onClick={() => setZoom(state.zoomLevel - 0.25)}
                    disabled={state.zoomLevel <= MIN_ZOOM}
                    title="Zoom out (-)"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35M8 11h6" />
                    </svg>
                </button>

                {/* Zoom slider */}
                <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.125}
                    value={state.zoomLevel}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-20 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />

                <button
                    className="w-7 h-7 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    onClick={() => setZoom(state.zoomLevel + 0.25)}
                    disabled={state.zoomLevel >= MAX_ZOOM}
                    title="Zoom in (+)"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" strokeWidth="2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35M11 8v6M8 11h6" />
                    </svg>
                </button>

                <button
                    className="text-[10px] text-zinc-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-800 transition-colors ml-1"
                    onClick={handleZoomToFit}
                    title="Zoom to fit"
                >
                    {Math.round(state.zoomLevel * 100)}%
                </button>
            </div>
        </div>
    );
}
