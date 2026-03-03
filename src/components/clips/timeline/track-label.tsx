"use client";

import * as React from "react";
import type { Track } from "./types";
import { TRACK_LABEL_WIDTH } from "./types";

interface TrackLabelProps {
    track: Track;
}

const TRACK_ICONS: Record<Track["type"], React.ReactNode> = {
    video: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
            <path d="M7 2v20M17 2v20M2 12h20M2 7h5M2 17h5M17 17h5M17 7h5" />
        </svg>
    ),
    audio: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
        </svg>
    ),
};

const TRACK_NAMES: Record<Track["type"], string> = {
    video: "Video",
    audio: "Audio",
};

const TRACK_COLORS: Record<Track["type"], string> = {
    video: "#3b82f6",
    audio: "#22c55e",
};

export function TrackLabel({ track }: TrackLabelProps) {
    return (
        <div
            className="flex flex-col items-start justify-center gap-1 px-2 border-r border-zinc-800 bg-zinc-900/50 shrink-0"
            style={{ width: TRACK_LABEL_WIDTH, height: track.height }}
            data-no-seek
        >
            {/* Track name + color indicator */}
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TRACK_COLORS[track.type] }} />
                <span className="text-[10px] font-medium text-zinc-300 leading-none">{TRACK_NAMES[track.type]}</span>
            </div>


        </div>
    );
}
