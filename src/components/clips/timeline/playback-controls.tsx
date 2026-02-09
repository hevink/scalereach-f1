"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useTimelineContext } from "./timeline-container";
import { PLAYBACK_SPEEDS } from "./types";
import { formatTime } from "./utils";
import { TimecodeInput } from "./timecode-input";

export function PlaybackControls() {
    const { currentTime, clipDuration, isPlaying, state, onSeek, onPlayPause, onSkipForward, onSkipBackward, setPlaybackSpeed } = useTimelineContext();
    const [showSpeedMenu, setShowSpeedMenu] = React.useState(false);
    const speedRef = React.useRef<HTMLDivElement>(null);

    // Close speed menu on outside click
    React.useEffect(() => {
        if (!showSpeedMenu) return;
        const handleClick = (e: MouseEvent) => {
            if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
                setShowSpeedMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, [showSpeedMenu]);

    return (
        <div className="flex items-center justify-between h-10 px-4 border-t border-zinc-800 bg-zinc-900/50">
            {/* Left: timecode */}
            <div className="flex items-center gap-1.5 text-xs font-mono min-w-[140px]">
                <TimecodeInput value={currentTime} duration={clipDuration} onSeek={onSeek} />
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-500">{formatTime(clipDuration)}</span>
            </div>

            {/* Center: transport controls */}
            <div className="flex items-center gap-1">
                {/* Skip backward */}
                <button
                    className="w-7 h-7 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    onClick={onSkipBackward || (() => onSeek(Math.max(0, currentTime - 5)))}
                    title="Skip backward 5s"
                >
                    <svg width="14" height="14" strokeWidth="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 7V17" />
                        <path d="M17.03 5.27C17.42 4.96 18 5.24 18 5.74V18.26C18 18.76 17.42 19.04 17.03 18.73L9.1 12.47C8.79 12.23 8.79 11.77 9.1 11.53L17.03 5.27Z" />
                    </svg>
                </button>

                {/* Play/Pause */}
                <button
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-zinc-200 transition-colors"
                    onClick={onPlayPause}
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="6" y="5" width="4" height="14" rx="1" />
                            <rect x="14" y="5" width="4" height="14" rx="1" />
                        </svg>
                    ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6.91 4.54C6.51 4.3 6 4.59 6 5.05V18.95C6 19.41 6.51 19.7 6.91 19.46L18.63 12.52C19.02 12.28 19.02 11.72 18.63 11.48L6.91 4.54Z" />
                        </svg>
                    )}
                </button>

                {/* Skip forward */}
                <button
                    className="w-7 h-7 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    onClick={onSkipForward || (() => onSeek(Math.min(clipDuration, currentTime + 5)))}
                    title="Skip forward 5s"
                >
                    <svg width="14" height="14" strokeWidth="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 7V17" />
                        <path d="M6.97 5.27C6.58 4.96 6 5.24 6 5.74V18.26C6 18.76 6.58 19.04 6.97 18.73L14.9 12.47C15.21 12.23 15.21 11.77 14.9 11.53L6.97 5.27Z" />
                    </svg>
                </button>
            </div>

            {/* Right: speed selector */}
            <div className="flex items-center gap-2 min-w-[140px] justify-end" ref={speedRef}>
                <div className="relative">
                    <button
                        className={cn(
                            "text-xs font-mono px-2 py-1 rounded hover:bg-zinc-800 transition-colors",
                            state.playbackSpeed !== 1 ? "text-blue-400" : "text-zinc-400",
                        )}
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    >
                        {state.playbackSpeed}x
                    </button>

                    {showSpeedMenu && (
                        <div className="absolute bottom-full right-0 mb-1 bg-zinc-800 border border-zinc-700 rounded-md shadow-lg py-1 z-50 animate-in fade-in duration-150">
                            {PLAYBACK_SPEEDS.map((speed) => (
                                <button
                                    key={speed}
                                    className={cn(
                                        "block w-full text-left text-xs px-3 py-1.5 hover:bg-zinc-700 transition-colors",
                                        speed === state.playbackSpeed ? "text-blue-400" : "text-zinc-300",
                                    )}
                                    onClick={() => {
                                        setPlaybackSpeed(speed);
                                        setShowSpeedMenu(false);
                                    }}
                                >
                                    {speed}x
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
