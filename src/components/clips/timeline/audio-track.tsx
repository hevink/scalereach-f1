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
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
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

    // Draw waveform with dual-color playback indicator
    React.useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || state.trackWidth <= 0) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = state.trackWidth * dpr;
        canvas.height = track.height * dpr;
        ctx.scale(dpr, dpr);

        // Background
        ctx.fillStyle = "#1c1c1e";
        ctx.fillRect(0, 0, state.trackWidth, track.height);

        const waveform = waveformDataRef.current;
        if (waveform.length === 0) return;

        const centerY = track.height / 2;
        const playedX = timeToX(currentTime);

        const playedColor = track.muted ? "#3f3f46" : "#22c55e";
        const unplayedColor = track.muted ? "#27272a" : "#52525b";

        waveform.forEach((value, i) => {
            const x = i * totalBarWidth;
            const barHeight = value * (track.height - 4);
            ctx.fillStyle = x <= playedX ? playedColor : unplayedColor;
            ctx.fillRect(x, centerY - barHeight / 2, barWidth, barHeight);
        });
    }, [state.trackWidth, track.height, track.muted, currentTime, timeToX, totalBarWidth]);

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
            <canvas
                ref={canvasRef}
                style={{ width: state.trackWidth, height: track.height, display: "block" }}
            />
            {/* Loading state */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60">
                    <span className="text-[10px] text-zinc-500 animate-pulse">Loading waveform...</span>
                </div>
            )}
        </div>
    );
}
