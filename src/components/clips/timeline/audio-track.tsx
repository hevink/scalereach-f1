"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Track } from "./types";
import { useTimelineContext } from "./timeline-container";

interface AudioTrackProps {
    track: Track;
}

export function AudioTrack({ track }: AudioTrackProps) {
    const { state, clipDuration, currentTime, videoSrc, onSeek, xToTime, timeToX } = useTimelineContext();
    const baseCanvasRef = React.useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = React.useRef<HTMLCanvasElement>(null);
    const waveformDataRef = React.useRef<number[]>([]);
    const trackRef = React.useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    const barWidth = 2;
    const gap = 2;
    const totalBarWidth = barWidth + gap;

    // Extract waveform data
    React.useEffect(() => {
        if (state.trackWidth <= 0) return;

        const barCount = Math.floor(state.trackWidth / totalBarWidth);

        // Generate placeholder waveform
        waveformDataRef.current = Array.from({ length: barCount }, () => Math.random() * 0.8 + 0.1);
        setIsLoading(true);

        // Try to extract real waveform
        if (videoSrc && clipDuration > 0) {
            let cancelled = false;
            const extractWaveform = async () => {
                try {
                    const audioContext = new AudioContext();
                    const response = await fetch(videoSrc);
                    const arrayBuffer = await response.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

                    const channelData = audioBuffer.getChannelData(0);
                    const samplesPerBar = Math.floor(channelData.length / barCount);
                    const samples: number[] = [];

                    for (let i = 0; i < barCount; i++) {
                        const start = i * samplesPerBar;
                        const end = start + samplesPerBar;
                        let sum = 0;
                        for (let j = start; j < end; j++) {
                            sum += Math.abs(channelData[j] || 0);
                        }
                        samples.push(Math.min(1, (sum / samplesPerBar) * 5));
                    }

                    if (!cancelled) {
                        waveformDataRef.current = samples;
                        setIsLoading(false);
                    }
                    audioContext.close();
                } catch {
                    if (!cancelled) setIsLoading(false);
                }
            };
            extractWaveform();
            return () => { cancelled = true; };
        } else {
            setIsLoading(false);
        }
    }, [videoSrc, clipDuration, state.trackWidth, totalBarWidth]);

    // Draw static waveform (base layer — unplayed color + overlay layer — played color)
    // Only redraws when waveform data, size, or mute state changes (NOT on currentTime)
    React.useEffect(() => {
        const baseCanvas = baseCanvasRef.current;
        const overlayCanvas = overlayCanvasRef.current;
        if (!baseCanvas || !overlayCanvas || state.trackWidth <= 0) return;

        const dpr = window.devicePixelRatio || 1;
        const waveform = waveformDataRef.current;
        const centerY = track.height / 2;
        const unplayedColor = track.muted ? "#27272a" : "#52525b";
        const playedColor = track.muted ? "#3f3f46" : "#22c55e";

        // Draw base canvas (unplayed waveform)
        baseCanvas.width = state.trackWidth * dpr;
        baseCanvas.height = track.height * dpr;
        const baseCtx = baseCanvas.getContext("2d");
        if (!baseCtx) return;
        baseCtx.scale(dpr, dpr);
        baseCtx.fillStyle = "#1c1c1e";
        baseCtx.fillRect(0, 0, state.trackWidth, track.height);

        waveform.forEach((value, i) => {
            const x = i * totalBarWidth;
            const barHeight = value * (track.height - 4);
            baseCtx.fillStyle = unplayedColor;
            baseCtx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
        });

        // Draw overlay canvas (played waveform — full width, clipped via CSS)
        overlayCanvas.width = state.trackWidth * dpr;
        overlayCanvas.height = track.height * dpr;
        const overlayCtx = overlayCanvas.getContext("2d");
        if (!overlayCtx) return;
        overlayCtx.scale(dpr, dpr);

        waveform.forEach((value, i) => {
            const x = i * totalBarWidth;
            const barHeight = value * (track.height - 4);
            overlayCtx.fillStyle = playedColor;
            overlayCtx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
        });
    }, [state.trackWidth, track.height, track.muted, isLoading, totalBarWidth]);

    // Playback position — only updates the overlay clip width (no canvas redraw)
    const playedX = timeToX(currentTime);

    // Scrub on drag
    const calculateTime = React.useCallback(
        (clientX: number) => {
            if (!trackRef.current) return 0;
            const rect = trackRef.current.getBoundingClientRect();
            return xToTime(clientX - rect.left);
        },
        [xToTime],
    );

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        onSeek(calculateTime(e.clientX));
    };

    React.useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => onSeek(calculateTime(e.clientX));
        const handleMouseUp = () => setIsDragging(false);

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };
    }, [isDragging, calculateTime, onSeek]);

    return (
        <div
            ref={trackRef}
            className={cn(
                "relative rounded overflow-hidden cursor-pointer",
                isDragging && "cursor-grabbing",
                track.muted && "opacity-50",
            )}
            style={{ width: state.trackWidth, height: track.height }}
            onMouseDown={handleMouseDown}
        >
            {/* Base waveform (unplayed color) */}
            <canvas
                ref={baseCanvasRef}
                style={{ width: state.trackWidth, height: track.height, display: "block" }}
            />
            {/* Overlay waveform (played color) — clipped to playback position */}
            <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: playedX }}
            >
                <canvas
                    ref={overlayCanvasRef}
                    style={{ width: state.trackWidth, height: track.height, display: "block" }}
                />
            </div>
            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60">
                    <span className="text-[10px] text-zinc-500 animate-pulse">Loading waveform...</span>
                </div>
            )}
        </div>
    );
}
