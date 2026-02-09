"use client";

import * as React from "react";
import type { LoopRegion } from "./types";
import { clamp } from "./utils";

interface UseTimelineKeyboardOptions {
    onSeek: (time: number) => void;
    onPlayPause?: () => void;
    currentTime: number;
    clipDuration: number;
    isPlaying: boolean;
    zoomLevel: number;
    setZoom: (level: number) => void;
    addMarker: (time: number, label?: string, color?: string) => void;
    setLoopRegion: (region: LoopRegion | null) => void;
    loopRegion: LoopRegion | null;
    playbackSpeed: number;
    setPlaybackSpeed: (speed: number) => void;
}

const FRAME_DURATION = 1 / 30;
const JKL_SPEEDS = [1, 2, 4, 8];

export function useTimelineKeyboard({
    onSeek,
    onPlayPause,
    currentTime,
    clipDuration,
    isPlaying,
    zoomLevel,
    setZoom,
    addMarker,
    setLoopRegion,
    loopRegion,
    playbackSpeed,
    setPlaybackSpeed,
}: UseTimelineKeyboardOptions) {
    const jklIndexRef = React.useRef(0);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't capture when typing in inputs
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;

            switch (e.key) {
                case " ": {
                    e.preventDefault();
                    onPlayPause?.();
                    break;
                }

                case "ArrowLeft": {
                    e.preventDefault();
                    const step = e.shiftKey ? 1 : FRAME_DURATION;
                    onSeek(clamp(currentTime - step, 0, clipDuration));
                    break;
                }

                case "ArrowRight": {
                    e.preventDefault();
                    const step = e.shiftKey ? 1 : FRAME_DURATION;
                    onSeek(clamp(currentTime + step, 0, clipDuration));
                    break;
                }

                case "j":
                case "J": {
                    e.preventDefault();
                    jklIndexRef.current = Math.min(jklIndexRef.current + 1, JKL_SPEEDS.length - 1);
                    const step = JKL_SPEEDS[jklIndexRef.current] * FRAME_DURATION;
                    onSeek(clamp(currentTime - step, 0, clipDuration));
                    break;
                }

                case "k":
                case "K": {
                    e.preventDefault();
                    jklIndexRef.current = 0;
                    onPlayPause?.();
                    break;
                }

                case "l":
                case "L": {
                    e.preventDefault();
                    jklIndexRef.current = Math.min(jklIndexRef.current + 1, JKL_SPEEDS.length - 1);
                    const step = JKL_SPEEDS[jklIndexRef.current] * FRAME_DURATION;
                    onSeek(clamp(currentTime + step, 0, clipDuration));
                    break;
                }

                case "Home": {
                    e.preventDefault();
                    onSeek(0);
                    break;
                }

                case "End": {
                    e.preventDefault();
                    onSeek(clipDuration);
                    break;
                }

                case "+":
                case "=": {
                    e.preventDefault();
                    setZoom(zoomLevel + 0.25);
                    break;
                }

                case "-":
                case "_": {
                    e.preventDefault();
                    setZoom(zoomLevel - 0.25);
                    break;
                }

                case "m":
                case "M": {
                    e.preventDefault();
                    addMarker(currentTime);
                    break;
                }

                case "[": {
                    e.preventDefault();
                    setLoopRegion({
                        inPoint: currentTime,
                        outPoint: loopRegion?.outPoint ?? clipDuration,
                        enabled: true,
                    });
                    break;
                }

                case "]": {
                    e.preventDefault();
                    setLoopRegion({
                        inPoint: loopRegion?.inPoint ?? 0,
                        outPoint: currentTime,
                        enabled: true,
                    });
                    break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [
        onSeek, onPlayPause, currentTime, clipDuration, isPlaying,
        zoomLevel, setZoom, addMarker, setLoopRegion, loopRegion,
        playbackSpeed, setPlaybackSpeed,
    ]);
}
