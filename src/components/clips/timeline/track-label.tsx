"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Track } from "./types";
import { TRACK_LABEL_WIDTH } from "./types";
import { useTimelineContext } from "./timeline-container";

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
    const { toggleTrackVisibility, toggleTrackLock, toggleTrackMute } = useTimelineContext();

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

            {/* Controls */}
            <div className="flex items-center gap-0.5">
                {/* Visibility toggle */}
                <button
                    className={cn(
                        "w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors",
                        track.visible ? "text-zinc-400" : "text-zinc-600",
                    )}
                    onClick={() => toggleTrackVisibility(track.id)}
                    title={track.visible ? "Hide track" : "Show track"}
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {track.visible ? (
                            <>
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                            </>
                        ) : (
                            <>
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                                <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                                <line x1="1" y1="1" x2="23" y2="23" />
                            </>
                        )}
                    </svg>
                </button>

                {/* Lock toggle */}
                <button
                    className={cn(
                        "w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors",
                        track.locked ? "text-yellow-500" : "text-zinc-600",
                    )}
                    onClick={() => toggleTrackLock(track.id)}
                    title={track.locked ? "Unlock track" : "Lock track"}
                >
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {track.locked ? (
                            <>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </>
                        ) : (
                            <>
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </>
                        )}
                    </svg>
                </button>

                {/* Mute toggle (audio only) */}
                {track.type === "audio" && (
                    <button
                        className={cn(
                            "w-5 h-5 flex items-center justify-center rounded hover:bg-zinc-700 transition-colors",
                            track.muted ? "text-red-500" : "text-zinc-600",
                        )}
                        onClick={() => toggleTrackMute(track.id)}
                        title={track.muted ? "Unmute" : "Mute"}
                    >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            {track.muted ? (
                                <>
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <line x1="23" y1="9" x2="17" y2="15" />
                                    <line x1="17" y1="9" x2="23" y2="15" />
                                </>
                            ) : (
                                <>
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                                </>
                            )}
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}
